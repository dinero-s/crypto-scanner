import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model, Types } from 'mongoose';
import { AuditLogEntity, AuditLogDoc } from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { FilterAuditLogDto } from '../dto/filter-audit-log.dto';
import {
    AuditLogTableItemDto,
    AuditLogUserShortDto,
} from '../dto/audit-log-table-item.dto';
import { AuditLogDetailDto, ChangedFieldDto } from '../dto/audit-log-detail.dto';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';

/** Аудит действий администраторов */
@Injectable()
export class AuditLogService {
    constructor(
        @DatabaseModel(AuditLogEntity.name)
        private readonly auditLogModel: Model<AuditLogDoc>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
    ) {}

    /** Создаёт запись аудита по DTO */
    async create(createDto: CreateAuditLogDto): Promise<AuditLogDoc> {
        const auditLog = new this.auditLogModel({
            ...createDto,
            adminId: new Types.ObjectId(createDto.adminId),
            entityId: createDto.entityId ? createDto.entityId : undefined,
        });

        return await auditLog.save();
    }

    /** Возвращает список записей аудита с фильтрацией и пагинацией (формат для таблицы) */
    async findAll(filterDto: FilterAuditLogDto): Promise<{
        data: AuditLogTableItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const query: Record<string, unknown> = {};

        if (filterDto.action) {
            query.action = filterDto.action;
        }

        if (filterDto.category) {
            query.category = filterDto.category;
        }

        if (filterDto.entity) {
            query.entity = filterDto.entity;
        }

        if (filterDto.status) {
            query.status = filterDto.status;
        }

        if (filterDto.adminId) {
            query.adminId = new Types.ObjectId(filterDto.adminId);
        }

        if (filterDto.dateFrom || filterDto.dateTo) {
            const dateFilter: { $gte?: Date; $lte?: Date } = {};
            if (filterDto.dateFrom) dateFilter.$gte = new Date(filterDto.dateFrom);
            if (filterDto.dateTo) dateFilter.$lte = new Date(filterDto.dateTo);
            query.createdAt = dateFilter;
        }

        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;
        const skip = (page - 1) * limit;

        const [rawData, total] = await Promise.all([
            this.auditLogModel
                .find(query)
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.auditLogModel.countDocuments(query).exec(),
        ]);

        const mapped = await Promise.all(rawData.map((doc) => this.toTableItem(doc)));
        const data = mapped.filter((item) => item !== null) as AuditLogTableItemDto[];
        const totalPages = Math.ceil(total / limit) || 1;
        return { data, total, page, limit, totalPages };
    }

    /** Возвращает запись аудита по ID или 404 (формат для деталей) */
    async findOne(id: string): Promise<AuditLogDetailDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Некорректный формат ID');
        }

        const auditLog = await this.auditLogModel
            .findById(id)
            .populate('adminId', 'name email')
            .lean()
            .exec();

        if (!auditLog) {
            throw new NotFoundException('Запись аудита не найдена');
        }

        return this.toDetail(auditLog);
    }

    private async toTableItem(
        doc: Record<string, unknown>,
    ): Promise<AuditLogTableItemDto | null> {
        const admin = doc.adminId as { email?: string } | null;
        const createdAt =
            (doc.createdAt as Date)?.toISOString?.() ?? String(doc.createdAt);
        const category = (doc.category as AuditCategory) ?? AuditCategory.ADMIN_SETTINGS;
        const entity = typeof doc.entity === 'string' ? doc.entity : '';
        const type = this.mapCategoryToType(category);
        const summary =
            typeof doc.summary === 'string'
                ? doc.summary
                : typeof doc.description === 'string'
                ? doc.description
                : '';
        const userIp =
            typeof doc.ipAddress === 'string' ? (doc.ipAddress as string) : undefined;
        const reason =
            typeof doc.reason === 'string' && doc.reason.trim().length > 0
                ? (doc.reason as string)
                : undefined;
        const user = await this.buildUserShort(doc, entity, category);

        const isUserEntity =
            entity === 'users' ||
            entity === 'user' ||
            category === AuditCategory.USER;

        if (isUserEntity && !user) {
            return null;
        }

        const result: AuditLogTableItemDto = {
            id: String(doc._id),
            type,
            date: createdAt,
            action: summary,
            email: admin?.email ?? '',
        };

        if (userIp) {
            result.userIp = userIp;
        }
        if (reason) {
            result.reason = reason;
        }
        if (user) {
            result.user = user;
        }

        return result;
    }

    private toDetail(doc: Record<string, unknown>): AuditLogDetailDto {
        const admin = doc.adminId as { email?: string } | null;
        const oldData = (doc.oldData as Record<string, unknown>) ?? {};
        const newData = (doc.newData as Record<string, unknown>) ?? {};
        const changedFields = this.computeChangedFields(oldData, newData);
        const fullObject = { ...oldData, ...newData };

        return {
            id: String(doc._id),
            createdAt: (doc.createdAt as Date)?.toISOString?.() ?? String(doc.createdAt),
            adminEmail: admin?.email ?? '',
            category: (doc.category as AuditLogDetailDto['category']) ?? AuditCategory.ADMIN_SETTINGS,
            objectName: String(doc.objectName ?? doc.entityId ?? doc.entity ?? ''),
            action: doc.action as AuditLogDetailDto['action'],
            status: (doc.status as AuditLogDetailDto['status']) ?? AuditStatus.SUCCESS,
            summary: String(doc.summary ?? doc.description ?? ''),
            entityId: String(doc.entityId ?? ''),
            fullObject,
            changedFields,
            reason: String(doc.reason ?? ''),
            executionResult: String(doc.executionResult ?? ''),
            oldData,
            newData,
        };
    }

    private mapCategoryToType(category: AuditCategory): string {
        const map: Record<AuditCategory, string> = {
            [AuditCategory.USER]: 'Пользователь',
            [AuditCategory.ADMIN_SETTINGS]: 'Админ',
        };
        return map[category] ?? 'Прочее';
    }

    private async buildUserShort(
        doc: Record<string, unknown>,
        entity: string,
        category: AuditCategory,
    ): Promise<AuditLogUserShortDto | undefined> {
        const isUserEntity =
            entity === 'users' ||
            entity === 'user' ||
            category === AuditCategory.USER;

        if (!isUserEntity) {
            return undefined;
        }

        const entityId = doc.entityId;
        const id =
            typeof entityId === 'string'
                ? entityId
                : entityId !== undefined
                ? String(entityId)
                : '';

        const oldData = (doc.oldData as Record<string, unknown>) ?? {};
        const newData = (doc.newData as Record<string, unknown>) ?? {};

        const emailFromNew =
            typeof newData.email === 'string' ? newData.email : undefined;
        const emailFromOld =
            typeof oldData.email === 'string' ? oldData.email : undefined;
        const email = emailFromNew ?? emailFromOld ?? '';

        const isEmailConfirmedFromNew =
            typeof newData.isEmailConfirmed === 'boolean'
                ? newData.isEmailConfirmed
                : undefined;
        const isEmailConfirmedFromOld =
            typeof oldData.isEmailConfirmed === 'boolean'
                ? oldData.isEmailConfirmed
                : undefined;
        const isEmailConfirmed = isEmailConfirmedFromNew ?? isEmailConfirmedFromOld;

        if (email && isEmailConfirmed === true) {
            return {
                _id: id,
                email,
            };
        }

        if (!id) {
            return undefined;
        }

        type LeanUserShort = {
            _id: string;
            email?: string;
            isEmailConfirmed?: boolean;
        };

        const user = await this.usersModel
            .findById(id)
            .select('email isEmailConfirmed')
            .lean<LeanUserShort>()
            .exec();

        if (!user || !user.isEmailConfirmed || !user.email) {
            return undefined;
        }

        return {
            _id: String(user._id),
            email: user.email,
        };
    }

    private computeChangedFields(
        oldData: Record<string, unknown>,
        newData: Record<string, unknown>,
    ): ChangedFieldDto[] {
        const allKeys = new Set([
            ...Object.keys(oldData),
            ...Object.keys(newData),
        ]);
        const hidden = new Set(['password', 'newPassword', 'oldPassword', 'token', 'refreshToken']);
        const result: ChangedFieldDto[] = [];

        for (const key of allKeys) {
            if (hidden.has(key)) continue;
            const oldVal = oldData[key];
            const newVal = newData[key];
            const oldStr = JSON.stringify(oldVal);
            const newStr = JSON.stringify(newVal);
            if (oldStr !== newStr) {
                result.push({ field: key, oldValue: oldVal, newValue: newVal });
            }
        }

        return result;
    }
}
