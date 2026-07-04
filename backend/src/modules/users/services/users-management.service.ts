import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UsersRepositoryService } from './users-repository.service';

export interface FindAllOptions {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    isBlocked?: boolean;
    isDisabled?: boolean;
    search?: string;
    registrationDateFrom?: string;
    registrationDateTo?: string;
}

const SENSITIVE_FIELDS =
    '-password -reset_code -phoneConfirmationCode -passwordResetCode -emailConfirmationCode';

/** Управление пользователями: CRUD, блокировка, экспорт */
@Injectable()
export class UsersManagementService {
    private readonly logger = new Logger(UsersManagementService.name);

    constructor(
        private readonly usersRepository: UsersRepositoryService,
    ) {}

    /** Возвращает список пользователей с пагинацией и фильтрами */
    async findAll(options: FindAllOptions) {
        const {
            page,
            limit,
            sortBy,
            sortOrder,
            isBlocked,
            isDisabled,
            search,
            registrationDateFrom,
            registrationDateTo,
        } = options;
        const usersModel = this.usersRepository.getModel();
        const skip = (page - 1) * limit;

        const query: Record<string, unknown> = {};

        if (typeof isBlocked === 'boolean') {
            query.isBlocked = isBlocked;
        }
        if (typeof isDisabled === 'boolean') {
            query.isDisabled = isDisabled;
        }

        if (registrationDateFrom || registrationDateTo) {
            query.registrationDate = {};
            if (registrationDateFrom) {
                (query.registrationDate as Record<string, Date>).$gte = new Date(registrationDateFrom);
            }
            if (registrationDateTo) {
                (query.registrationDate as Record<string, Date>).$lte = new Date(registrationDateTo);
            }
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        const sort: Record<string, 1 | -1> = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };

        try {
            const [users, total] = await Promise.all([
                usersModel
                    .find(query)
                    .select(SENSITIVE_FIELDS)
                    .sort(sort)
                    .skip(skip)
                    .limit(Number(limit))
                    .lean()
                    .exec(),
                usersModel.countDocuments(query).exec(),
            ]);

            const totalPages = Math.ceil(total / limit) || 1;

            return {
                data: users,
                total,
                page,
                limit,
                totalPages,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            };
        } catch (error) {
            this.logger.error('Error fetching users:', error);
            throw new InternalServerErrorException(
                'Ошибка при получении пользователей',
            );
        }
    }

    /** Проверяет корректность идентификатора пользователя */
    private ensureValidObjectId(id: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Некорректный ID пользователя');
        }
    }

    /** Возвращает пользователя по id без чувствительных полей */
    async findOne(id: string) {
        this.ensureValidObjectId(id);
        const user = await this.usersRepository
            .getModel()
            .findById(id)
            .select(SENSITIVE_FIELDS)
            .lean()
            .exec();
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Возвращает пользователя по id для админской панели */
    async findOneAdmin(id: string) {
        return this.findOne(id);
    }

    /** Обновляет профиль пользователя (без изменения email и телефона) */
    async update(id: string, updateData: UpdateUserDto) {
        const usersModel = this.usersRepository.getModel();
        if (updateData.email) {
            throw new BadRequestException('Email не может быть изменен');
        }
        if (updateData.phone) {
            const existingUser = await usersModel
                .findOne({ phone: updateData.phone, _id: { $ne: new Types.ObjectId(id) } })
                .select('_id')
                .lean()
                .exec();
            if (existingUser) {
                throw new BadRequestException('Телефон уже используется');
            }
        }

        const user = await usersModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .select(SENSITIVE_FIELDS);

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return user;
    }

    /** Блокирует пользователя и сохраняет причину блокировки */
    async blockUser(id: string, reason: string) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel
            .findByIdAndUpdate(
                id,
                { $set: { isBlocked: true, blockReason: reason } },
                { new: true },
            )
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Разблокирует пользователя и очищает причину блокировки */
    async unblockUser(id: string) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel
            .findByIdAndUpdate(
                id,
                { $set: { isBlocked: false, blockReason: null } },
                { new: true },
            )
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Логически отключает пользователя */
    async disableUser(id: string) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel
            .findByIdAndUpdate(
                id,
                { $set: { isDisabled: true } },
                { new: true },
            )
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Включает ранее отключенного пользователя */
    async enableUser(id: string) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel
            .findByIdAndUpdate(
                id,
                { $set: { isDisabled: false } },
                { new: true },
            )
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Обновляет пользователя из админской части */
    async updateAdmin(id: string, updateData: UpdateUserDto) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        if (updateData.phone) {
            const existingUser = await usersModel
                .findOne({ phone: updateData.phone, _id: { $ne: new Types.ObjectId(id) } })
                .select('_id')
                .lean()
                .exec();
            if (existingUser) {
                throw new BadRequestException('Телефон уже используется');
            }
        }

        const user = await usersModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return user;
    }

    /** Удаляет пользователя и возвращает его данные */
    async remove(id: string) {
        this.ensureValidObjectId(id);
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel
            .findByIdAndDelete(id)
            .select(SENSITIVE_FIELDS)
            .exec();
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user;
    }

    /** Удаляет пользователя и возвращает служебное сообщение */
    async deleteUser(userId: string) {
        this.ensureValidObjectId(userId);
        const usersModel = this.usersRepository.getModel();

        const user = await usersModel
            .findByIdAndDelete(userId)
            .select(SENSITIVE_FIELDS)
            .exec();

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return { message: 'Пользователь удален' };
    }
}
