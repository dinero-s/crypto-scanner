import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';

type UserNotificationPrefsLean = {
    _id: Types.ObjectId;
    pushNotificationsEnabled?: boolean;
    notificationSoundEnabled?: boolean;
};
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { UsersEntity } from '../entities/users.entity';

/** Репозиторий: низкоуровневый доступ к БД пользователей */
@Injectable()
export class UsersRepositoryService {
    constructor(
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersEntity>,
    ) {}

    /** Ищет пользователя по номеру телефона */
    async findByPhone(phone: string) {
        return this.usersModel.findOne({ phone });
    }

    /** Ищет пользователя по email */
    async findByEmail(email: string): Promise<UsersEntity | null> {
        return this.usersModel.findOne({ email }).exec();
    }

    /** Ищет пользователя по Google sub (googleId) */
    async findByGoogleId(googleId: string): Promise<UsersEntity | null> {
        return this.usersModel.findOne({ googleId }).exec();
    }

    /** Ищет пользователя по Apple sub (appleId) */
    async findByAppleId(appleId: string): Promise<UsersEntity | null> {
        return this.usersModel.findOne({ appleId }).exec();
    }

    /** Ищет пользователя по строковому идентификатору */
    async findById(id: string): Promise<UsersEntity | null> {
        return this.usersModel.findById(id).exec();
    }

    /** Ищет пользователя по ObjectId */
    async findByObjectId(id: Types.ObjectId): Promise<UsersEntity | null> {
        return this.usersModel.findById(id).exec();
    }

    /** Частично обновляет документ пользователя */
    async updatePartial(
        id: string | Types.ObjectId,
        update: Partial<UsersEntity>
    ) {
        return this.usersModel.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true }
        );
    }

    /** Возвращает инстанс модели пользователей */
    getModel(): Model<UsersEntity> {
        return this.usersModel;
    }

    /** Флаги настроек push-уведомлений пользователей */
    async findNotificationPrefsByUserIds(
        userIds: Types.ObjectId[],
    ): Promise<Map<string, { pushOk: boolean; soundOk: boolean }>> {
        if (userIds.length === 0) {
            return new Map();
        }
        const rows = await this.usersModel
            .find({ _id: { $in: userIds } })
            .select({
                pushNotificationsEnabled: 1,
                notificationSoundEnabled: 1,
            })
            .lean()
            .exec();
        const m = new Map<string, { pushOk: boolean; soundOk: boolean }>();
        for (const r of rows as UserNotificationPrefsLean[]) {
            m.set(String(r._id), {
                pushOk: r.pushNotificationsEnabled !== false,
                soundOk: r.notificationSoundEnabled !== false,
            });
        }
        return m;
    }
}
