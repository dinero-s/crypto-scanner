import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

type DecimalInstance = InstanceType<typeof Decimal>;

/** Безопасное преобразование в Decimal */
export function toDecimal(value: number | string | null | undefined): DecimalInstance | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) {
        return null;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return null;
    }
    try {
        const decimal = new Decimal(value);
        if (!decimal.isFinite()) {
            return null;
        }
        return decimal;
    } catch {
        return null;
    }
}

/** Преобразование Decimal в number для хранения/API */
export function toNumber(value: DecimalInstance | null, fallback = 0): number {
    if (!value) {
        return fallback;
    }
    return value.toNumber();
}

/** basisPercent = (futuresPrice - spotPrice) / spotPrice * 100 */
export function calculateBasisPercent(futuresPrice: number, spotPrice: number): number | null {
    const futures = toDecimal(futuresPrice);
    const spot = toDecimal(spotPrice);
    if (!futures || !spot || spot.lte(0)) {
        return null;
    }
    return toNumber(futures.minus(spot).div(spot).mul(100));
}

/** spotPerpSpreadPercent = (perpBid - spotAsk) / spotAsk * 100 */
export function calculateSpotPerpSpreadPercent(perpBid: number, spotAsk: number): number | null {
    return calculateBasisPercent(perpBid, spotAsk);
}

/** Комиссии round-trip в процентах */
export function calculateFeesPercent(spotFeeRate: number, futuresFeeRate: number): number {
    const spot = toDecimal(spotFeeRate) ?? new Decimal(0);
    const futures = toDecimal(futuresFeeRate) ?? new Decimal(0);
    return toNumber(spot.plus(futures).mul(2).mul(100));
}

/** Slippage в процентах */
export function calculateSlippagePercent(slippageRate: number): number {
    const rate = toDecimal(slippageRate) ?? new Decimal(0);
    return toNumber(rate.mul(100));
}

/** netBasisPercent = basisPercent - feesPercent - slippagePercent */
export function calculateNetBasisPercent(
    basisPercent: number,
    feesPercent: number,
    slippagePercent: number,
): number {
    const basis = toDecimal(basisPercent) ?? new Decimal(0);
    const fees = toDecimal(feesPercent) ?? new Decimal(0);
    const slippage = toDecimal(slippagePercent) ?? new Decimal(0);
    return toNumber(basis.minus(fees).minus(slippage));
}

/** netFundingPercent = fundingRatePercent - feesPercent - slippagePercent */
export function calculateNetFundingPercent(
    fundingRate: number,
    feesPercent: number,
    slippagePercent: number,
): number {
    const rate = toDecimal(fundingRate) ?? new Decimal(0);
    const fundingPercent = rate.mul(100);
    return calculateNetBasisPercent(toNumber(fundingPercent), feesPercent, slippagePercent);
}

/** estimatedNetProfitUsd = positionSizeUsd * netPercent / 100 */
export function calculateEstimatedProfitUsd(
    positionSizeUsd: number,
    netPercent: number,
): number {
    const size = toDecimal(positionSizeUsd);
    const net = toDecimal(netPercent);
    if (!size || !net || size.lte(0)) {
        return 0;
    }
    return toNumber(size.mul(net).div(100));
}

/** Теоретический APR для funding (per-interval rate → годовой) */
export function calculateTheoreticalFundingApr(
    netFundingPercent: number,
    fundingIntervalHours: number,
): number | null {
    if (fundingIntervalHours <= 0) {
        return null;
    }
    const net = toDecimal(netFundingPercent);
    if (!net) {
        return null;
    }
    const intervalsPerDay = new Decimal(24).div(fundingIntervalHours);
    return toNumber(net.mul(intervalsPerDay).mul(365));
}

/** APR basis с учётом дней до экспирации */
export function calculateAnnualizedBasisApr(
    netBasisPercent: number,
    daysToExpiry: number,
): number | null {
    if (daysToExpiry <= 0) {
        return null;
    }
    const net = toDecimal(netBasisPercent);
    if (!net) {
        return null;
    }
    return toNumber(net.div(daysToExpiry).mul(365));
}

/** Минуты до следующего funding */
export function calculateTimeToFundingMinutes(
    nextFundingTime: number | null | undefined,
    nowMs: number,
): number | null {
    if (nextFundingTime === undefined || nextFundingTime === null) {
        return null;
    }

    const next = toDecimal(nextFundingTime);
    if (!next || next.lte(0)) {
        return null;
    }
    const diffMs = next.minus(nowMs);
    if (diffMs.lte(0)) {
        return 0;
    }
    return toNumber(diffMs.div(60_000));
}

/** Проверка валидности ценовых данных */
export function isValidPrice(value: number | null | undefined): boolean {
    const decimal = toDecimal(value ?? null);
    return decimal !== null && decimal.gt(0);
}

/** Проверка положительного net yield */
export function isPositiveNetYield(netPercent: number): boolean {
    const net = toDecimal(netPercent);
    return net !== null && net.gt(0);
}

/** Ключ для сопоставления инструментов */
export function buildMarketKey(
    exchange: string,
    baseAsset: string,
    quoteAsset: string,
): string {
    return `${exchange}:${baseAsset}:${quoteAsset}`;
}
