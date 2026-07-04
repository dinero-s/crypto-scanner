import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum, MarketTypeEnum } from '../enums/exchange.enum';
import { NormalizedSymbolResponseDto } from '../dto/normalized-symbol.dto';
import { ExchangeSymbolInterface } from '../interfaces/market-symbol.interface';
import { toBybitNativeSymbol } from '../adapters/bybit/bybit.normalizer';
import { toGateNativeSymbol } from '../adapters/gate/gate.normalizer';
import {
    toKrakenFuturesNativeSymbol,
    toKrakenSpotNativeSymbol,
} from '../adapters/kraken/kraken.normalizer';
import {
    toKucoinFuturesNativeSymbol,
    toKucoinSpotNativeSymbol,
} from '../adapters/kucoin/kucoin.normalizer';
import { toOkxNativeSymbol } from '../adapters/okx/okx.normalizer';

/** Нормализация символов между биржами */
@Injectable()
export class SymbolNormalizerService {
    private readonly logger = new Logger(SymbolNormalizerService.name);

    /** Унифицировать символ (BTC/USDT) в нативный формат биржи */
    toNative(
        exchange: ExchangeEnum,
        marketType: MarketTypeEnum,
        unifiedSymbol: string,
    ): string {
        switch (exchange) {
            case ExchangeEnum.BINANCE:
            case ExchangeEnum.BYBIT:
                return toBybitNativeSymbol(unifiedSymbol);
            case ExchangeEnum.OKX:
                return toOkxNativeSymbol(unifiedSymbol, marketType);
            case ExchangeEnum.GATE:
                return toGateNativeSymbol(unifiedSymbol);
            case ExchangeEnum.KUCOIN:
                return marketType === MarketTypeEnum.SPOT
                    ? toKucoinSpotNativeSymbol(unifiedSymbol)
                    : toKucoinFuturesNativeSymbol(unifiedSymbol);
            case ExchangeEnum.KRAKEN:
                return marketType === MarketTypeEnum.SPOT
                    ? toKrakenSpotNativeSymbol(unifiedSymbol)
                    : toKrakenFuturesNativeSymbol(unifiedSymbol);
            default:
                this.logger.warn(`toNative fallback: ${exchange}/${unifiedSymbol}`);
                return unifiedSymbol.replace('/', '');
        }
    }

    /** Нативный символ → унифицированный (упрощённый парсинг) */
    toUnified(
        exchange: ExchangeEnum,
        marketType: MarketTypeEnum,
        nativeSymbol: string,
    ): NormalizedSymbolResponseDto {
        const parsed = this.parseNativeSymbol(exchange, marketType, nativeSymbol);

        return {
            unified: `${parsed.base}/${parsed.quote}`,
            native: nativeSymbol,
            base: parsed.base,
            quote: parsed.quote,
        };
    }

    /** Построить полный контекст символа */
    buildSymbolContext(
        exchange: ExchangeEnum,
        marketType: MarketTypeEnum,
        unifiedSymbol: string,
    ): ExchangeSymbolInterface {
        const [base, quote] = unifiedSymbol.split('/');

        return {
            exchange,
            marketType,
            nativeSymbol: this.toNative(exchange, marketType, unifiedSymbol),
            unified: {
                base: base ?? unifiedSymbol,
                quote: quote ?? 'USDT',
                unified: unifiedSymbol,
            },
        };
    }

    private parseNativeSymbol(
        exchange: ExchangeEnum,
        marketType: MarketTypeEnum,
        nativeSymbol: string,
    ): { base: string; quote: string } {
        if (exchange === ExchangeEnum.OKX) {
            const parts = nativeSymbol.replace('-SWAP', '').split('-');
            return { base: parts[0] ?? nativeSymbol, quote: parts[1] ?? 'USDT' };
        }

        if (exchange === ExchangeEnum.GATE || exchange === ExchangeEnum.KUCOIN) {
            const separator = nativeSymbol.includes('_') ? '_' : '-';
            const parts = nativeSymbol.replace(/M$/, '').split(separator);
            const base = parts[0] === 'XBT' ? 'BTC' : (parts[0] ?? nativeSymbol);
            return { base, quote: parts[1] ?? 'USDT' };
        }

        if (exchange === ExchangeEnum.KRAKEN && marketType !== MarketTypeEnum.SPOT) {
            const pair = nativeSymbol.replace(/^PF_/, '');
            const base = pair.endsWith('USD')
                ? pair.slice(0, -3).replace('XBT', 'BTC')
                : pair;
            return { base, quote: 'USD' };
        }

        if (exchange === ExchangeEnum.KRAKEN && marketType === MarketTypeEnum.SPOT) {
            if (nativeSymbol.endsWith('USDT')) {
                return {
                    base: nativeSymbol.slice(0, -4).replace('XBT', 'BTC'),
                    quote: 'USDT',
                };
            }
            if (nativeSymbol.endsWith('USD')) {
                return {
                    base: nativeSymbol.slice(0, -3).replace('XBT', 'BTC'),
                    quote: 'USD',
                };
            }
        }

        if (nativeSymbol.includes('/')) {
            const [base, quote] = nativeSymbol.split('/');
            return { base: base ?? nativeSymbol, quote: quote ?? 'USDT' };
        }

        if (nativeSymbol.endsWith('USDT')) {
            return {
                base: nativeSymbol.slice(0, -4),
                quote: 'USDT',
            };
        }

        if (nativeSymbol.endsWith('USD')) {
            return {
                base: nativeSymbol.slice(0, -3),
                quote: 'USD',
            };
        }

        return { base: nativeSymbol, quote: 'USDT' };
    }
}
