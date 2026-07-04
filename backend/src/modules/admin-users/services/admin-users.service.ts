import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { AdminUsersEntity, AdminUsersDoc } from '../entities/admin-users.entity';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { LoginAdminDto } from '../dtos/login-admin.dto';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateAdminDto } from '../dtos/update-admin.dto';
import { AuditLogService } from 'src/modules/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import { AuditCategory } from 'src/modules/audit-log/enums/audit-category.enum';
import { AuditStatus } from 'src/modules/audit-log/enums/audit-status.enum';

/** Управление администраторами: аутентификация, роли, CRUD */
@Injectable()
export class AdminUsersService {
    constructor(
        @DatabaseModel(AdminUsersEntity.name)
        private readonly model: Model<AdminUsersEntity>,
        private readonly configService: ConfigService,
        private readonly auditLogService: AuditLogService,
    ) { }

    /** Создаёт администратора без авто-авторизации */
    async create(createAdminDto: CreateAdminDto) {
        const { email, password, role, name } = createAdminDto;

        const existingAdmin = await this.model.findOne({ email });
        if (existingAdmin) {
            throw new BadRequestException('Пользователь с таким email уже существует');
        }



        const admin = await this.model.create({
            email,
            password,
            status: 'ACTIVE',
            role,
            name,
        });

        return {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            status: admin.status,
            role: admin.role,
        };
    }

    /** Авторизует администратора по email и паролю */
    async login(loginAdminDto: LoginAdminDto) {
        const email = loginAdminDto.email.toLowerCase().trim();
        const password = loginAdminDto.password.trim();

        const admin = await this.model.findOne({ email });
        if (!admin) {
            throw new UnauthorizedException('Введен неверный email или пароль');
        }

        if (admin.status === 'BLOCKED') {
            throw new ForbiddenException('Аккаунт заблокирован');
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Введен неверный email или пароль');
        }

        await this.model.updateOne(
            { _id: admin._id },
            { $set: { lastLoginAt: new Date() } }
        );

        void this.auditLogService
            .create({
                adminId: admin._id.toString(),
                action: AuditAction.LOGIN,
                entity: 'admin-users',
                category: AuditCategory.ADMIN_SETTINGS,
                summary: 'Вход в админ-панель',
                status: AuditStatus.SUCCESS,
                executionResult: 'Успешно',
            })
            .catch(() => undefined);

        return await this.issueTokenPair(admin);
    }

    /** Обновляет access/refresh с rotation: старый refresh становится недействительным */
    async refreshTokens(refreshToken: string) {
        const refreshSecret = this.configService.get<string>(
            'auth.jwt.refreshToken.secretKey',
        );
        if (!refreshSecret) {
            throw new UnauthorizedException('Недействительный refresh token');
        }

        let payload: { id?: string; type?: string; rtv?: number };
        try {
            payload = jwt.verify(refreshToken, refreshSecret) as {
                id?: string;
                type?: string;
                rtv?: number;
            };
        } catch {
            throw new UnauthorizedException('Недействительный refresh token');
        }

        if (
            payload.type !== 'admin' ||
            !payload.id ||
            payload.rtv === undefined
        ) {
            throw new UnauthorizedException('Недействительный refresh token');
        }

        const admin = await this.model.findById(payload.id);
        if (!admin) {
            throw new UnauthorizedException('Администратор не найден');
        }
        if (admin.status === 'BLOCKED') {
            throw new ForbiddenException('Аккаунт заблокирован');
        }
        if ((admin.refreshTokenVersion ?? 0) !== payload.rtv) {
            throw new UnauthorizedException('Refresh token отозван');
        }

        return await this.issueTokenPair(admin);
    }

    /** Возвращает список администраторов с пагинацией */
    async findAll(options: { page?: number; limit?: number } = {}) {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model.find().select('-password').skip(skip).limit(limit).exec(),
            this.model.countDocuments().exec(),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;
        return { data, total, page, limit, totalPages };
    }

    /** Возвращает администратора по ID или 404 */
    async findOne(id: string) {
        const admin = await this.model.findById(id).select('-password');
        if (!admin) {
            throw new NotFoundException('Администратор не найден');
        }
        return admin;
    }

    /** Обновляет данные администратора */
    async update(id: string, updateData: UpdateAdminDto) {
        const admin = await this.model.findById(id);
        if (!admin) {
            throw new NotFoundException('Администратор не найден');
        }

        if (updateData.name !== undefined) {
            admin.name = updateData.name;
        }

        if (updateData.password !== undefined) {
            admin.password = updateData.password;
        }

        if (updateData.email !== undefined) {
            const existingAdmin = await this.model.findOne({ email: updateData.email });
            if (existingAdmin && existingAdmin._id.toString() !== id) {
                throw new BadRequestException('Пользователь с таким email уже существует');
            }
            admin.email = updateData.email;
        }

        if (updateData.status !== undefined) {
            admin.status = updateData.status;
        }

        await admin.save();
        return this.findOne(id);
    }

    /** Обновляет роль администратора */
    async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
        const admin = await this.model.findById(id);
        if (!admin) {
            throw new NotFoundException('Администратор не найден');
        }

        admin.role = updateRoleDto.role;
        await admin.save();

        return {
            message: 'Роль успешно обновлена',
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                status: admin.status,
            }
        };
    }

    /** Удаляет администратора по ID */
    async remove(id: string) {
        const admin = await this.model.findById(id);
        if (!admin) {
            throw new NotFoundException('Администратор не найден');
        }
        await admin.deleteOne();
        return { message: 'Администратор успешно удален' };
    }

    /** Выдаёт access/refresh с rotation через refreshTokenVersion */
    private async issueTokenPair(admin: AdminUsersDoc) {
        const accessSecret = this.configService.get<string>(
            'auth.jwt.accessToken.secretKey',
        );
        const refreshSecret = this.configService.get<string>(
            'auth.jwt.refreshToken.secretKey',
        );
        const accessExpiry = this.configService.get<string>(
            'auth.jwt.accessToken.expirationTime',
        );
        const refreshExpiry = this.configService.get<string>(
            'auth.jwt.refreshToken.expirationTime',
        );

        if (!accessSecret || !refreshSecret) {
            throw new UnauthorizedException('JWT не настроен');
        }

        const adminId = String(admin._id);
        const nextRefreshVersion = (admin.refreshTokenVersion ?? 0) + 1;
        await this.model.updateOne(
            { _id: admin._id },
            { $set: { refreshTokenVersion: nextRefreshVersion } },
        );

        const accessPayload = {
            id: adminId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            type: 'admin' as const,
        };
        const refreshPayload = {
            id: adminId,
            type: 'admin' as const,
            rtv: nextRefreshVersion,
        };

        const token = jwt.sign(accessPayload, accessSecret, {
            expiresIn: accessExpiry ?? '1h',
        });
        const refresh_token = jwt.sign(refreshPayload, refreshSecret, {
            expiresIn: refreshExpiry ?? '90d',
        });

        return {
            token,
            refresh_token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                status: admin.status,
                role: admin.role,
            },
        };
    }

    /** Меняет пароль администратора после проверки старого пароля */
    async changePassword(adminId: string, dto: ChangePasswordDto): Promise<void> {
        const admin = await this.model.findById(adminId);
        if (!admin) {
            throw new UnauthorizedException('Admin not found');
        }
        const isPasswordValid = bcrypt.compareSync(dto.oldPassword, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid old password');
        }


        await this.model.findByIdAndUpdate(adminId, {
            password: dto.newPassword,
            $inc: { refreshTokenVersion: 1 },
        });
    }


} 