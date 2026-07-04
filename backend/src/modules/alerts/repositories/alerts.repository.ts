import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { CreateAlertSettingsDto, UpdateAlertSettingsDto } from '../dto/alert-settings.dto';
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
        private readonly deliveryModel: Model<AlertDeliveryDoc>,
    ) {}

    /** Найти настройки по Telegram user ObjectId */
    async findSettingsByUserId(userId: Types.ObjectId): Promise<AlertSettingsDoc | null> {
        return this.settingsModel.findOne({ telegramUserId: userId }).exec();
    }

    /** Создать настройки */
    async createSettings(
        userId: Types.ObjectId,
        dto: CreateAlertSettingsDto,
    ): Promise<AlertSettingsDoc> {
        return this.settingsModel.create({
            telegramUserId: userId,
            enabled: dto.enabled,
            thresholds: dto.thresholds,
        });
    }

    /** Обновить настройки */
    async updateSettings(
        userId: Types.ObjectId,
        dto: UpdateAlertSettingsDto,
    ): Promise<AlertSettingsDoc | null> {
        return this.settingsModel
            .findOneAndUpdate({ telegramUserId: userId }, { $set: dto }, { new: true })
            .exec();
    }

    /** Все включённые настройки */
    async findAllEnabledSettings(): Promise<AlertSettingsDoc[]> {
        return this.settingsModel.find({ enabled: true }).exec();
    }

    /** Записать доставку */
    async createDelivery(
        data: Partial<AlertDeliveryEntity>,
    ): Promise<AlertDeliveryDoc> {
        return this.deliveryModel.create(data);
    }

    /** Обновить статус доставки */
    async updateDeliveryStatus(
        id: Types.ObjectId,
        status: AlertDeliveryStatusEnum,
        errorMessage?: string,
    ): Promise<void> {
        await this.deliveryModel
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
}
