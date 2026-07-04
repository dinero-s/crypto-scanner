import { ArbitrageOpportunityDoc } from 'src/modules/arbitrage/entities/arbitrage-opportunity.entity';

/** Округление net yield для fingerprint */
export function roundNetYieldForFingerprint(netYieldPercent: number): number {
    return Math.round(netYieldPercent * 10_000) / 10_000;
}

/** Fingerprint возможности для dedup алертов */
export function buildOpportunityFingerprint(opp: Pick<
    ArbitrageOpportunityDoc,
    'type' | 'baseAsset' | 'quoteAsset' | 'spotExchange' | 'futuresExchange' | 'netYieldPercent' | 'nextFundingTime'
>): string {
    const roundedNetYield = roundNetYieldForFingerprint(opp.netYieldPercent);
    const nextFunding = opp.nextFundingTime ?? 0;

    return [
        opp.type,
        opp.baseAsset.toUpperCase(),
        opp.quoteAsset.toUpperCase(),
        opp.spotExchange,
        opp.futuresExchange,
        String(roundedNetYield),
        String(nextFunding),
    ].join('|');
}

/** Ключ символа для cooldown */
export function buildSymbolKey(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
}
