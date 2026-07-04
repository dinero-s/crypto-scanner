import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { UpdateTelegramUserDto } from '../dto/telegram-user.dto';
import { TelegramUserDoc, TelegramUserEntity } from '../entities/telegram-user.entity';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

/** Репозиторий Telegram-пользователей */
@Injectable()
export class TelegramUsersRepository {
    constructor(
        @DatabaseModel(TelegramUserEntity.name)
        private readonly model: Model<TelegramUserDoc>,
    ) {}

    /** Найти по Telegram ID */
    async findByTelegramId(telegramId: string): Promise<TelegramUserDoc | null> {
        return this.model.findOne({ telegramId }).exec();
    }

    /** Найти по MongoDB _id */
    async findById(id: string): Promise<TelegramUserDoc | null> {
        return this.model.findById(id).exec();
    }

    /** Создать или обновить пользователя (upsert) */
    async upsertFromTelegram(data: {
        telegramId: string;
        chatId: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        languageCode?: string;
    }): Promise<TelegramUserDoc> {
        return this.model
            .findOneAndUpdate(
                { telegramId: data.telegramId },
                {
                    $set: {
                        chatId: data.chatId,
                        username: data.username,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        languageCode: data.languageCode ?? 'ru',
                        lastSeenAt: new Date(),
                    },
                    $setOnInsert: {
                        subscriptionStatus: SubscriptionStatusEnum.FREE,
                    },
                },
                { upsert: true, new: true },
            )
            .exec();
    }

    /** Обновить профиль */
    async updateProfile(
        telegramId: string,
        dto: UpdateTelegramUserDto,
    ): Promise<TelegramUserDoc | null> {
        return this.model
            .findOneAndUpdate({ telegramId }, { $set: dto }, { new: true })
            .exec();
    }

    /** Mock: получить статус подписки */
    async getSubscriptionStatus(telegramId: string): Promise<SubscriptionStatusEnum> {
        const user = await this.findByTelegramId(telegramId);
        return user?.subscriptionStatus ?? SubscriptionStatusEnum.FREE;
    }
}
