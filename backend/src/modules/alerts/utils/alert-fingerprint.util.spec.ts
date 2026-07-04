import { buildOpportunityFingerprint, buildSymbolKey, roundNetYieldForFingerprint } from './alert-fingerprint.util';

describe('alert-fingerprint.util', () => {
    it('buildSymbolKey нормализует регистр', () => {
        expect(buildSymbolKey('btc', 'usdt')).toBe('BTC/USDT');
    });

    it('roundNetYieldForFingerprint округляет до 4 знаков', () => {
        expect(roundNetYieldForFingerprint(0.039456)).toBe(0.0395);
    });

    it('buildOpportunityFingerprint включает все поля', () => {
        const fingerprint = buildOpportunityFingerprint({
            type: 'funding' as never,
            baseAsset: 'btc',
            quoteAsset: 'usdt',
            spotExchange: 'binance' as never,
            futuresExchange: 'bybit' as never,
            netYieldPercent: 0.039456,
            nextFundingTime: 1_700_000_000_000,
        });

        expect(fingerprint).toBe(
            'funding|BTC|USDT|binance|bybit|0.0395|1700000000000',
        );
    });
});
