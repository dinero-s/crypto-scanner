import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { UpdateAlertSettingsDto } from '../dto/alert-settings.dto';
import {
    AlertDeliveryDoc,
    AlertDeliveryEntity,
} from '../entities/alert-delivery.entity';
import { AlertSettingsDoc, AlertSettingsEntity } from '../entities/alert-settings.entity';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';

/** Репозиторий алертов */
@Injectable()
export class AlertsRepository {
    constructor(
        @DatabaseModel(AlertSettingsEntity.name)
        private readonly settingsModel: Model<AlertSettingsDoc>,
        @DatabaseModel(AlertDeliveryEntity.name)
        private readonly sentModel: Model<AlertDeliveryDoc>,
    ) {}

    /** Найти настройки по Telegram user ObjectId */
    async findSettingsByUserId(userId: Types.ObjectId): Promise<AlertSettingsDoc | null> {
        return this.settingsModel.findOne({ telegramUserId: userId }).exec();
    }

    /** Создать настройки по умолчанию */
    async createDefaultSettings(userId: Types.ObjectId): Promise<AlertSettingsDoc> {
        return this.settingsModel.create({ telegramUserId: userId });
    }

    /** Получить или создать настройки */
    async getOrCreateSettings(userId: Types.ObjectId): Promise<AlertSettingsDoc> {
        const existing = await this.findSettingsByUserId(userId);
        if (existing) {
            return existing;
        }
        return this.createDefaultSettings(userId);
    }

    /** Обновить настройки */
    async updateSettings(
        userId: Types.ObjectId,
        dto: UpdateAlertSettingsDto,
    ): Promise<AlertSettingsDoc | null> {
        await this.getOrCreateSettings(userId);
        return this.settingsModel
            .findOneAndUpdate({ telegramUserId: userId }, { $set: dto }, { new: true })
            .exec();
    }

    /** Все включённые настройки */
    async findAllEnabledSettings(): Promise<AlertSettingsDoc[]> {
        return this.settingsModel.find({ enabled: true }).exec();
    }

    /** Проверка dedup по fingerprint */
    async hasSentFingerprint(userId: Types.ObjectId, fingerprint: string): Promise<boolean> {
        const doc = await this.sentModel
            .findOne({ telegramUserId: userId, fingerprint })
            .select({ _id: 1 })
            .lean()
            .exec();
        return doc !== null;
    }

    /** Проверка cooldown user + symbol + type */
    async isInCooldown(
        userId: Types.ObjectId,
        opportunityType: ArbitrageTypeEnum,
        symbolKey: string,
        cooldownSec: number,
    ): Promise<boolean> {
        const since = Date.now() - cooldownSec * 1000;
        const doc = await this.sentModel
            .findOne({
                telegramUserId: userId,
                opportunityType,
                symbolKey,
                status: AlertDeliveryStatusEnum.SENT,
                sentAt: { $gte: since },
            })
            .select({ _id: 1 })
            .lean()
            .exec();
        return doc !== null;
    }

    /** Записать отправленный алерт */
    async createSentAlert(
        data: Partial<AlertDeliveryEntity>,
    ): Promise<AlertDeliveryDoc> {
        return this.sentModel.create(data);
    }

    /** Обновить статус доставки */
    async updateDeliveryStatus(
        id: Types.ObjectId,
        status: AlertDeliveryStatusEnum,
        errorMessage?: string,
    ): Promise<void> {
        await this.sentModel
            .updateOne(
                { _id: id },
                {
                    $set: {
                        status,
                        errorMessage: errorMessage ?? null,
                        sentAt: status === AlertDeliveryStatusEnum.SENT ? Date.now() : null,
                    },
                },
            )
            .exec();
    }

    /** Количество отправленных алертов за сегодня */
    async countSentToday(userId: Types.ObjectId): Promise<number> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return this.sentModel
            .countDocuments({
                telegramUserId: userId,
                status: AlertDeliveryStatusEnum.SENT,
                sentAt: { $gte: startOfDay.getTime() },
            })
            .exec();
    }
}
