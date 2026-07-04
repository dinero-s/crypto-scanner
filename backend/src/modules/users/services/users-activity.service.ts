import { Injectable } from '@nestjs/common';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model, Types } from 'mongoose';
import { UsersEntity } from '../entities/users.entity';

/** Обновление lastActivityAt и lastLoginAt для DAU/MAU (TZ) */
@Injectable()
export class UsersActivityService {
    constructor(
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersEntity>,
    ) {}

    /** Обновляет lastActivityAt при любой активности пользователя */
    async updateLastActivity(userId: string | Types.ObjectId): Promise<void> {
        const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
        await this.usersModel.updateOne(
            { _id: id },
            { $set: { lastActivityAt: new Date() } },
        );
    }

    /** Обновляет lastActivityAt, lastLoginAt и loginCount при логине/refresh */
    async recordLogin(userId: string | Types.ObjectId): Promise<void> {
        const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
        await this.usersModel.updateOne(
            { _id: id },
            {
                $set: {
                    lastActivityAt: new Date(),
                    lastLoginAt: new Date(),
                },
                $inc: { loginCount: 1 },
            },
        );
    }
}
