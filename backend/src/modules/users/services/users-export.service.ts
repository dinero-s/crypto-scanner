import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';
import { UsersRepositoryService } from './users-repository.service';
import type { FindAllOptions } from './users-management.service';

/** Экспорт пользователей */
@Injectable()
export class UsersExportService {
    constructor(private readonly usersRepository: UsersRepositoryService) {}

    /** Экспортирует отфильтрованных пользователей в CSV-строку */
    async exportToCsv(options: FindAllOptions): Promise<string> {
        const {
            isBlocked,
            isDisabled,
            search,
            registrationDateFrom,
            registrationDateTo,
            sortBy,
            sortOrder,
        } = options;
        const usersModel = this.usersRepository.getModel();

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
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        const sort: Record<string, 1 | -1> = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };

        const users = await usersModel
            .find(query)
            .select('-password -phoneConfirmationCode -passwordResetCode -emailConfirmationCode')
            .sort(sort)
            .lean()
            .exec();

        const records = users.map(user => {
            const u = user as Record<string, unknown>;
            return {
                id: String(u._id ?? ''),
                phone: String(u.phone ?? ''),
                fullName: String(u.fullName ?? ''),
                email: String(u.email ?? ''),
                city: String(u.city ?? ''),
                company: String(u.company ?? ''),
                clientType: String(u.clientType ?? ''),
                isActive: u.isActive,
                isBlocked: u.isBlocked,
                isDisabled: u.isDisabled ?? false,
                blockReason: String(u.blockReason ?? ''),
                isDeleted: u.isDeleted || false,
                isEmailConfirmed: u.isEmailConfirmed || false,
                registrationDate: (u.registrationDate as Date)?.toISOString?.() ?? '',
                createdAt: (u.createdAt as Date)?.toISOString?.() ?? '',
                updatedAt: (u.updatedAt as Date)?.toISOString?.() ?? '',
            };
        });

        const parser = new Parser();
        return parser.parse(records);
    }
}
