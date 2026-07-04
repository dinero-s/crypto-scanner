import {
    calculateBasisPercent,
    calculateEstimatedProfitUsd,
    calculateFeesPercent,
    calculateNetBasisPercent,
    calculateNetFundingPercent,
    calculateSlippagePercent,
    calculateSpotPerpSpreadPercent,
    isPositiveNetYield,
    isValidPrice,
    toDecimal,
} from './arbitrage-math.util';

describe('arbitrage-math.util', () => {
    describe('calculateBasisPercent', () => {
        it('считает basis = (futures - spot) / spot * 100', () => {
            const basis = calculateBasisPercent(65_500, 65_000);
            expect(basis).toBeCloseTo(0.7692, 3);
        });

        it('возвращает null при spotPrice <= 0', () => {
            expect(calculateBasisPercent(100, 0)).toBeNull();
            expect(calculateBasisPercent(100, -1)).toBeNull();
        });

        it('возвращает null при битых данных', () => {
            expect(calculateBasisPercent(Number.NaN, 100)).toBeNull();
            expect(calculateBasisPercent(100, Number.NaN)).toBeNull();
        });
    });

    describe('calculateNetBasisPercent', () => {
        it('netBasis = basis - fees - slippage', () => {
            const fees = calculateFeesPercent(0.001, 0.0005);
            const slippage = calculateSlippagePercent(0.0005);
            const basis = 1.5;
            const net = calculateNetBasisPercent(basis, fees, slippage);
            expect(net).toBeCloseTo(basis - fees - slippage, 6);
        });
    });

    describe('calculateNetFundingPercent', () => {
        it('netFunding = fundingRate% - fees - slippage', () => {
            const fundingRate = 0.0003;
            const fees = calculateFeesPercent(0.001, 0.0005);
            const slippage = calculateSlippagePercent(0.0005);
            const net = calculateNetFundingPercent(fundingRate, fees, slippage);
            expect(net).toBeCloseTo(fundingRate * 100 - fees - slippage, 6);
        });
    });

    describe('calculateEstimatedProfitUsd', () => {
        it('profit = positionSize * netPercent / 100', () => {
            expect(calculateEstimatedProfitUsd(10_000, 0.5)).toBeCloseTo(50, 2);
        });

        it('возвращает 0 при нулевом размере позиции', () => {
            expect(calculateEstimatedProfitUsd(0, 5)).toBe(0);
        });
    });

    describe('isPositiveNetYield', () => {
        it('фильтрует net <= 0', () => {
            expect(isPositiveNetYield(0.01)).toBe(true);
            expect(isPositiveNetYield(0)).toBe(false);
            expect(isPositiveNetYield(-0.01)).toBe(false);
        });
    });

    describe('isValidPrice', () => {
        it('отклоняет нулевые и битые цены', () => {
            expect(isValidPrice(100)).toBe(true);
            expect(isValidPrice(0)).toBe(false);
            expect(isValidPrice(null)).toBe(false);
            expect(isValidPrice(undefined)).toBe(false);
            expect(isValidPrice(Number.NaN)).toBe(false);
        });
    });

    describe('calculateSpotPerpSpreadPercent', () => {
        it('считает spread между perp bid и spot ask', () => {
            const spread = calculateSpotPerpSpreadPercent(65_100, 65_000);
            expect(spread).toBeCloseTo(0.1538, 3);
        });
    });

    describe('toDecimal', () => {
        it('обрабатывает невалидные значения', () => {
            expect(toDecimal('')).toBeNull();
            expect(toDecimal(Number.POSITIVE_INFINITY)).toBeNull();
        });
    });
});

describe('сортировка opportunities по opportunityScore', () => {
    it('сортирует по убыванию opportunityScore', () => {
        const items = [
            { opportunityScore: 45, netYieldPercent: 1.2 },
            { opportunityScore: 90, netYieldPercent: 0.5 },
            { opportunityScore: 70, netYieldPercent: 2.0 },
        ];

        const sorted = [...items].sort((a, b) => {
            if (b.opportunityScore !== a.opportunityScore) {
                return b.opportunityScore - a.opportunityScore;
            }
            return b.netYieldPercent - a.netYieldPercent;
        });

        expect(sorted[0]?.opportunityScore).toBe(90);
        expect(sorted[1]?.opportunityScore).toBe(70);
        expect(sorted[2]?.opportunityScore).toBe(45);
    });
});

describe('фильтрация отрицательных opportunities', () => {
    it('исключает opportunities с net <= 0', () => {
        const opportunities = [
            { netYieldPercent: 0.5 },
            { netYieldPercent: 0 },
            { netYieldPercent: -0.1 },
            { netYieldPercent: 1.2 },
        ];

        const filtered = opportunities.filter((o) => isPositiveNetYield(o.netYieldPercent));
        expect(filtered).toHaveLength(2);
        expect(filtered.every((o) => o.netYieldPercent > 0)).toBe(true);
    });
});
