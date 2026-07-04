import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { ArbitrageOpportunityDoc } from 'src/modules/arbitrage/entities/arbitrage-opportunity.entity';
import { ArbitrageRepository } from 'src/modules/arbitrage/repositories/arbitrage.repository';
import { AlertSettingsDoc } from '../entities/alert-settings.entity';
import { AlertTypeEnum } from '../enums/alert-type.enum';
import { UpdateAlertSettingsDto, AlertSettingsResponseDto } from '../dto/alert-settings.dto';
import { AlertsRepository } from '../repositories/alerts.repository';
import {
    buildOpportunityFingerprint,
    buildSymbolKey,
} from '../utils/alert-fingerprint.util';
import { formatOpportunityAlertMessage } from '../utils/alert-message.util';
import { AlertQueueProducerService } from './alert-queue.producer.service';
import { TelegramUsersRepository } from 'src/modules/telegram-users/repositories/telegram-users.repository';
import { SubscriptionStatusEnum } from 'src/modules/telegram-users/enums/subscription-status.enum';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';

const FREE_USER_TOP_LIMIT = 3;

/** Бизнес-логика алертов */
@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(
        private readonly alertsRepository: AlertsRepository,
        private readonly alertQueueProducer: AlertQueueProducerService,
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly telegramUsersRepository: TelegramUsersRepository,
        private readonly configService: ConfigService,
    ) {}

    /** Получить настройки пользователя */
    async getSettings(userId: Types.ObjectId): Promise<AlertSettingsResponseDto> {
        const settings = await this.alertsRepository.getOrCreateSettings(userId);
        return this.toSettingsResponse(settings);
    }

    /** Обновить настройки */
    async updateSettings(
        userId: Types.ObjectId,
        dto: UpdateAlertSettingsDto,
    ): Promise<AlertSettingsResponseDto> {
        const updated = await this.alertsRepository.updateSettings(userId, dto);
        if (!updated) {
            const settings = await this.alertsRepository.getOrCreateSettings(userId);
            return this.toSettingsResponse(settings);
        }
        return this.toSettingsResponse(updated);
    }

    /** Создать настройки по умолчанию для нового пользователя */
    async ensureDefaultSettings(userId: Types.ObjectId): Promise<AlertSettingsResponseDto> {
        const settings = await this.alertsRepository.getOrCreateSettings(userId);
        return this.toSettingsResponse(settings);
    }

    /** Количество алертов за сегодня */
    async countSentToday(userId: Types.ObjectId): Promise<number> {
        return this.alertsRepository.countSentToday(userId);
    }

    /** Проверить пороги и поставить уведомления в очередь */
    async evaluateAndDispatch(): Promise<void> {
        const enabled = this.configService.get<boolean>('telegram.alertsEnabled') ?? true;
        if (!enabled) {
            this.logger.log('Telegram alerts отключены в конфиге');
            return;
        }

        const opportunities = await this.arbitrageRepository.findByQuery({ limit: 200 });
        if (opportunities.length === 0) {
            this.logger.debug('evaluateAndDispatch: opportunities пуст');
            return;
        }

        const topOpportunityIds = this.resolveTopOpportunityIds(opportunities, FREE_USER_TOP_LIMIT);
        const settingsList = await this.alertsRepository.findAllEnabledSettings();
        let dispatched = 0;

        for (const settings of settingsList) {
            const user = await this.telegramUsersRepository.findById(String(settings.telegramUserId));
            if (!user?.chatId) {
                continue;
            }

            const isPremium =
                user.subscriptionStatus === SubscriptionStatusEnum.PREMIUM ||
                user.subscriptionStatus === SubscriptionStatusEnum.TRIAL;

            for (const opportunity of opportunities) {
                if (!this.matchesSettings(opportunity, settings)) {
                    continue;
                }

                if (!isPremium && !topOpportunityIds.has(String(opportunity._id))) {
                    continue;
                }

                const dispatchedOne = await this.tryDispatchAlert(
                    settings,
                    user.chatId,
                    opportunity,
                );
                if (dispatchedOne) {
                    dispatched += 1;
                }
            }
        }

        this.logger.log(`evaluateAndDispatch dispatched=${String(dispatched)}`);
    }

    private async tryDispatchAlert(
        settings: AlertSettingsDoc,
        chatId: string,
        opportunity: ArbitrageOpportunityDoc,
    ): Promise<boolean> {
        const fingerprint = buildOpportunityFingerprint(opportunity);
        const symbolKey = buildSymbolKey(opportunity.baseAsset, opportunity.quoteAsset);

        const alreadySent = await this.alertsRepository.hasSentFingerprint(
            settings.telegramUserId,
            fingerprint,
        );
        if (alreadySent) {
            return false;
        }

        const inCooldown = await this.alertsRepository.isInCooldown(
            settings.telegramUserId,
            opportunity.type,
            symbolKey,
            settings.alertCooldownSec,
        );
        if (inCooldown) {
            return false;
        }

        const message = formatOpportunityAlertMessage(opportunity);
        const delivery = await this.alertsRepository.createSentAlert({
            telegramUserId: settings.telegramUserId,
            fingerprint,
            opportunityType: opportunity.type,
            symbolKey,
            baseAsset: opportunity.baseAsset,
            quoteAsset: opportunity.quoteAsset,
            spotExchange: opportunity.spotExchange,
            futuresExchange: opportunity.futuresExchange,
            netYieldPercent: opportunity.netYieldPercent,
            nextFundingTime: opportunity.nextFundingTime,
            message,
            status: AlertDeliveryStatusEnum.PENDING,
        });

        await this.alertQueueProducer.enqueueAlert({
            telegramUserId: String(settings.telegramUserId),
            telegramChatId: chatId,
            alertType: this.mapArbitrageType(opportunity.type),
            message,
            fingerprint,
            deliveryId: String(delivery._id),
            calculatedAt: opportunity.calculatedAt,
        });

        return true;
    }

    private matchesSettings(
        opportunity: ArbitrageOpportunityDoc,
        settings: AlertSettingsDoc,
    ): boolean {
        if (opportunity.netYieldPercent < settings.minNetYield) {
            return false;
        }

        const fundingRate = Math.abs(opportunity.fundingRate ?? 0);
        if (fundingRate < settings.minFundingRate) {
            return false;
        }

        const basis = Math.abs(opportunity.basisPercent ?? 0);
        if (basis < settings.minBasis) {
            return false;
        }

        if (settings.allowedExchanges.length > 0) {
            const allowed = settings.allowedExchanges;
            if (
                !allowed.includes(opportunity.spotExchange) &&
                !allowed.includes(opportunity.futuresExchange)
            ) {
                return false;
            }
        }

        if (settings.symbolsWhitelist.length > 0) {
            const symbolKey = buildSymbolKey(opportunity.baseAsset, opportunity.quoteAsset);
            const normalizedWhitelist = settings.symbolsWhitelist.map((item) =>
                item.toUpperCase(),
            );
            if (!normalizedWhitelist.includes(symbolKey)) {
                return false;
            }
        }

        return true;
    }

    private resolveTopOpportunityIds(
        opportunities: ArbitrageOpportunityDoc[],
        limit: number,
    ): Set<string> {
        return new Set(
            [...opportunities]
                .sort((a, b) => b.opportunityScore - a.opportunityScore)
                .slice(0, limit)
                .map((item) => String(item._id)),
        );
    }

    private mapArbitrageType(type: ArbitrageTypeEnum): AlertTypeEnum {
        if (type === ArbitrageTypeEnum.CASH_CARRY) {
            return AlertTypeEnum.CASH_AND_CARRY;
        }
        return AlertTypeEnum.FUNDING_RATE;
    }

    private toSettingsResponse(settings: AlertSettingsDoc): AlertSettingsResponseDto {
        return {
            enabled: settings.enabled,
            minFundingRate: settings.minFundingRate,
            minNetYield: settings.minNetYield,
            minBasis: settings.minBasis,
            allowedExchanges: settings.allowedExchanges,
            symbolsWhitelist: settings.symbolsWhitelist,
            alertCooldownSec: settings.alertCooldownSec,
        };
    }
}
