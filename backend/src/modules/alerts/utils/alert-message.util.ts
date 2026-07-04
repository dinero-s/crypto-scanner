import { ArbitrageOpportunityDoc } from 'src/modules/arbitrage/entities/arbitrage-opportunity.entity';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

const EXCHANGE_LABELS: Record<ExchangeEnum, string> = {
    [ExchangeEnum.BINANCE]: 'Binance',
    [ExchangeEnum.BYBIT]: 'Bybit',
    [ExchangeEnum.OKX]: 'OKX',
    [ExchangeEnum.GATE]: 'Gate',
    [ExchangeEnum.KUCOIN]: 'KuCoin',
    [ExchangeEnum.KRAKEN]: 'Kraken',
};

/** Человекочитаемое имя биржи */
export function formatExchangeLabel(exchange: ExchangeEnum): string {
    return EXCHANGE_LABELS[exchange] ?? exchange;
}

/** Уровень риска по riskScore */
export function formatRiskLevel(riskScore: number): string {
    if (riskScore <= 33) {
        return 'Low';
    }
    if (riskScore <= 66) {
        return 'Medium';
    }
    return 'High';
}

/** Время до funding в минутах */
export function formatTimeToFunding(nextFundingTime?: number): string {
    if (!nextFundingTime || nextFundingTime <= Date.now()) {
        return 'скоро';
    }
    const minutes = Math.max(1, Math.round((nextFundingTime - Date.now()) / 60_000));
    return `через ${String(minutes)} мин`;
}

/** Оценочная прибыль на $1000 */
export function estimateProfitUsd1000(netYieldPercent: number): string {
    const profit = (1000 * netYieldPercent) / 100;
    return profit.toFixed(2);
}

/** Форматирование алерта для Telegram */
export function formatOpportunityAlertMessage(opp: ArbitrageOpportunityDoc): string {
    const asset = `${opp.baseAsset}/${opp.quoteAsset}`;
    const spot = formatExchangeLabel(opp.spotExchange);
    const perp = formatExchangeLabel(opp.futuresExchange);
    const fundingPct = ((opp.fundingRate ?? 0) * 100).toFixed(3);
    const netYield = opp.netYieldPercent.toFixed(3);
    const nextFunding = formatTimeToFunding(opp.nextFundingTime);
    const profit1000 = estimateProfitUsd1000(opp.netYieldPercent);
    const risk = formatRiskLevel(opp.riskScore);

    const title =
        opp.type === ArbitrageTypeEnum.CASH_CARRY
            ? '📊 Cash & Carry Opportunity'
            : '🚀 Funding Opportunity';

    return `${title}

Asset: ${asset}
Spot: ${spot}
Perp: ${perp}
Funding: ${fundingPct}%
Net Yield: ${netYield}%
Next funding: ${nextFunding}
Estimated profit on $1000: $${profit1000}
Risk: ${risk}

Оценочная доходность, не финансовая рекомендация.`;
}
