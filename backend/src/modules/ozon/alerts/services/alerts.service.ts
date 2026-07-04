import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { UsersRepositoryService } from 'src/modules/users/services/users-repository.service';
import { AlertEventStatus, AlertEventType, OzonSeverity } from '../../constants/ozon.enums';
import {
    OzonConnectionDoc,
    OzonConnectionEntity,
} from '../../integration/entities/ozon-connection.entity';
import { AlertEventDoc, AlertEventEntity } from '../entities/alert-event.entity';
import { TelegramAlertService } from './telegram-alert.service';
import { AlertQueueProducerService } from '../queue/alert-queue.producer.service';

export interface CreateAlertInput {
    userId: string;
    type: AlertEventType;
    severity: OzonSeverity;
    productId?: string;
    competitorProductId?: string;
    connectionId?: string;
    message: string;
    payload?: Record<string, unknown>;
}

/** Система уведомлений Telegram/email */
@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        private readonly usersRepository: UsersRepositoryService,
        private readonly mailerService: MailerService,
        private readonly telegramAlertService: TelegramAlertService,
        private readonly configService: ConfigService,
        private readonly alertQueueProducer: AlertQueueProducerService,
    ) {}

    async createAlert(input: CreateAlertInput): Promise<AlertEventDoc> {
        const alert = await this.alertModel.create({
            userId: new Types.ObjectId(input.userId),
            type: input.type,
            severity: input.severity,
            productId: input.productId,
            competitorProductId: input.competitorProductId
                ? new Types.ObjectId(input.competitorProductId)
                : undefined,
            message: input.message,
            payload: input.payload,
            status: AlertEventStatus.PENDING,
        });

        await this.alertQueueProducer.enqueueDispatch(
            String(alert._id),
            input.connectionId,
        );
        return alert;
    }

    /** Отправка алерта worker-ом очереди */
    async dispatchAlertById(alertId: string, connectionId?: string): Promise<void> {
        const alert = await this.alertModel.findById(new Types.ObjectId(alertId));
        if (!alert) {
            this.logger.warn(`alert not found alertId=${alertId}`);
            return;
        }

        if (
            alert.status === AlertEventStatus.SENT ||
            alert.status === AlertEventStatus.SKIPPED
        ) {
            return;
        }

        await this.dispatchAlert(alert, connectionId);
    }

    async sendTestAlert(
        userId: string,
        type: AlertEventType,
        severity: OzonSeverity,
        message?: string,
        connectionId?: string,
    ): Promise<AlertEventDoc> {
        return this.createAlert({
            userId,
            type,
            severity,
            connectionId,
            message: message ?? 'Тестовое уведомление Ozon Operator',
            payload: { test: true },
        });
    }

    /** Алерты при изменении цены конкурента (официальные данные) */
    async handleCompetitorPriceChange(
        userId: string,
        competitorProductId: string,
        previousPrice: number | undefined,
        currentPrice: number,
    ): Promise<void> {
        if (previousPrice === undefined) {
            return;
        }

        if (currentPrice < previousPrice) {
            await this.createAlert({
                userId,
                type: AlertEventType.COMPETITOR_PRICE_DROP,
                severity: OzonSeverity.MEDIUM,
                competitorProductId,
                message: `Конкурент снизил цену: ${String(previousPrice)} → ${String(currentPrice)}`,
                payload: { competitorProductId, previousPrice, currentPrice },
            });
        } else if (currentPrice > previousPrice) {
            await this.createAlert({
                userId,
                type: AlertEventType.COMPETITOR_PRICE_RISE,
                severity: OzonSeverity.LOW,
                competitorProductId,
                message: `Конкурент поднял цену: ${String(previousPrice)} → ${String(currentPrice)}`,
                payload: { competitorProductId, previousPrice, currentPrice },
            });
        }

        if (currentPrice === 0) {
            await this.createAlert({
                userId,
                type: AlertEventType.COMPETITOR_OUT_OF_STOCK,
                severity: OzonSeverity.MEDIUM,
                competitorProductId,
                message: 'У конкурента закончился товар (по официальным данным)',
                payload: { competitorProductId },
            });
        }
    }

    async listAlerts(userId: string, status?: string): Promise<AlertEventDoc[]> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };

        if (status) {
            filter.status = status;
        }

        return this.alertModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }

    private async dispatchAlert(
        alert: AlertEventDoc,
        connectionId?: string,
    ): Promise<void> {
        const emailEnabled =
            this.configService.get<boolean>('ozon.alerts.emailEnabled') === true;
        const telegramEnabled =
            this.configService.get<boolean>('ozon.alerts.telegramEnabled') === true;

        if (!emailEnabled && !telegramEnabled) {
            alert.status = AlertEventStatus.SKIPPED;
            await alert.save();
            this.logger.log(
                `alert skipped (channels disabled) alertId=${String(alert._id)}`,
            );
            return;
        }

        let emailSent = false;
        let telegramSent = false;
        let hasError = false;

        if (emailEnabled) {
            try {
                await this.sendEmail(alert);
                emailSent = true;
            } catch {
                hasError = true;
            }
        }

        if (telegramEnabled) {
            try {
                await this.sendTelegram(alert, connectionId);
                telegramSent = true;
            } catch {
                hasError = true;
            }
        }

        if (emailSent || telegramSent) {
            alert.status = AlertEventStatus.SENT;
            alert.sentAt = new Date();
        } else if (hasError) {
            alert.status = AlertEventStatus.FAILED;
        } else {
            alert.status = AlertEventStatus.SKIPPED;
        }

        await alert.save();
    }

    private async sendEmail(alert: AlertEventDoc): Promise<void> {
        const user = await this.usersRepository.findById(String(alert.userId));
        const email = user?.email?.trim();

        if (!email) {
            throw new Error('Email пользователя не задан');
        }

        if (user?.pushNotificationsEnabled === false) {
            this.logger.log(
                `email skipped (push disabled) userId=${String(alert.userId)}`,
            );
            return;
        }

        await this.mailerService.sendMail({
            to: email,
            subject: `[Ozon Operator] ${alert.type}`,
            text: alert.message,
        });
    }

    private async sendTelegram(
        alert: AlertEventDoc,
        connectionId?: string,
    ): Promise<void> {
        const chatId = await this.resolveTelegramChatId(
            String(alert.userId),
            connectionId,
        );

        if (!chatId) {
            throw new Error('Telegram chat_id не задан');
        }

        const text = `<b>Ozon Operator</b>\n${alert.type}\n${alert.message}`;
        await this.telegramAlertService.sendMessage(chatId, text);
    }

    private async resolveTelegramChatId(
        userId: string,
        connectionId?: string,
    ): Promise<string | undefined> {
        if (connectionId) {
            const connection = await this.connectionModel.findOne({
                _id: new Types.ObjectId(connectionId),
                userId: new Types.ObjectId(userId),
            });

            if (connection?.telegramChatId) {
                return connection.telegramChatId;
            }
        }

        const connectionWithChat = await this.connectionModel
            .findOne({
                userId: new Types.ObjectId(userId),
                telegramChatId: { $exists: true, $ne: '' },
                deletedAt: { $exists: false },
            })
            .sort({ updatedAt: -1 })
            .exec();

        return connectionWithChat?.telegramChatId;
    }
}
