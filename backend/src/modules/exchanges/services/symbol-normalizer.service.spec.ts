import { ExchangeEnum, MarketTypeEnum } from '../enums/exchange.enum';
import { SymbolNormalizerService } from './symbol-normalizer.service';

describe('SymbolNormalizerService', () => {
    const service = new SymbolNormalizerService();

    it('парсит Kraken futures PF_XBTUSD как BTC/USD', () => {
        const result = service.toUnified(
            ExchangeEnum.KRAKEN,
            MarketTypeEnum.PERPETUAL,
            'PF_XBTUSD',
        );

        expect(result).toMatchObject({
            unified: 'BTC/USD',
            base: 'BTC',
            quote: 'USD',
        });
    });

    it('парсит Kraken spot XBTUSDT как BTC/USDT', () => {
        const result = service.toUnified(
            ExchangeEnum.KRAKEN,
            MarketTypeEnum.SPOT,
            'XBTUSDT',
        );

        expect(result).toMatchObject({
            unified: 'BTC/USDT',
            base: 'BTC',
            quote: 'USDT',
        });
    });

    it('не подменяет Kraken USD на USDT для spot пар', () => {
        const result = service.toUnified(
            ExchangeEnum.KRAKEN,
            MarketTypeEnum.SPOT,
            'XBTUSD',
        );

        expect(result.quote).toBe('USD');
        expect(result.unified).toBe('BTC/USD');
    });
});
