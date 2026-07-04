import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ArbitrageFilterConfig } from '../interfaces/arbitrage-calculation.interface';
import { isPositiveNetYield } from '../utils/arbitrage-math.util';

/** Конфигурация и фильтрация арбитражных возможностей */
@Injectable()
export class ArbitrageFilterService {
    constructor(private readonly configService: ConfigService) {}

    /** Получить конфиг фильтров из ConfigService */
    getFilterConfig(): ArbitrageFilterConfig {
        const enabledExchanges =
            this.configService.get<ExchangeEnum[]>('scanner.enabledExchanges') ??
            Object.values(ExchangeEnum);

        return {
            minFundingRate: this.configService.get<number>('scanner.arbitrageMinFundingRate') ?? 0.00001,
            minNetYield: this.configService.get<number>('scanner.arbitrageMinNetYield') ?? 0,
            maxSpread: this.configService.get<number>('scanner.arbitrageMaxSpread') ?? 2,
            minVolume24h: this.configService.get<number>('scanner.arbitrageMinVolume24h') ?? 100_000,
            allowedExchanges: enabledExchanges,
            symbolWhitelist:
                this.configService.get<string[]>('scanner.arbitrageSymbolWhitelist') ?? [],
            symbolBlacklist:
                this.configService.get<string[]>('scanner.arbitrageSymbolBlacklist') ?? [],
            defaultPositionSizeUsd:
                this.configService.get<number>('scanner.defaultPositionSizeUsd') ?? 10_000,
            spotFeeRate: this.configService.get<number>('scanner.defaultSpotFeeRate') ?? 0.001,
            futuresFeeRate: this.configService.get<number>('scanner.defaultFuturesFeeRate') ?? 0.0005,
            defaultSlippage: this.configService.get<number>('scanner.defaultSlippage') ?? 0.0005,
            opportunityTtlSec:
                this.configService.get<number>('scanner.arbitrageOpportunityTtlSec') ?? 300,
        };
    }

    /** Проверка биржи */
    isExchangeAllowed(exchange: ExchangeEnum, config: ArbitrageFilterConfig): boolean {
        return config.allowedExchanges.includes(exchange);
    }

    /** Проверка символа по whitelist/blacklist */
    isSymbolAllowed(symbol: string, config: ArbitrageFilterConfig): boolean {
        if (config.symbolBlacklist.includes(symbol)) {
            return false;
        }
        if (config.symbolWhitelist.length > 0) {
            return config.symbolWhitelist.includes(symbol);
        }
        return true;
    }

    /** Проверка ликвидности */
    hasSufficientVolume(volume24h: number, config: ArbitrageFilterConfig): boolean {
        if (!Number.isFinite(volume24h) || volume24h <= 0) {
            return false;
        }
        return volume24h >= config.minVolume24h;
    }

    /** Проверка funding rate порога */
    passesFundingRateFilter(fundingRate: number, config: ArbitrageFilterConfig): boolean {
        if (!Number.isFinite(fundingRate)) {
            return false;
        }
        return Math.abs(fundingRate) >= config.minFundingRate;
    }

    /** Проверка spread */
    passesSpreadFilter(spreadPercent: number | null, config: ArbitrageFilterConfig): boolean {
        if (spreadPercent === null || !Number.isFinite(spreadPercent)) {
            return false;
        }
        return Math.abs(spreadPercent) <= config.maxSpread;
    }

    /** Проверка net yield > 0 и minNetYield */
    passesNetYieldFilter(netYieldPercent: number, config: ArbitrageFilterConfig): boolean {
        if (!isPositiveNetYield(netYieldPercent)) {
            return false;
        }
        return netYieldPercent >= config.minNetYield;
    }

    /** Только USDT-quoted рынки для сравнимых возможностей (Kraken USD исключён) */
    passesQuoteAssetFilter(quoteAsset: string): boolean {
        return quoteAsset === 'USDT';
    }
}
