import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { NetYieldCalculatorService } from './net-yield-calculator.service';

describe('NetYieldCalculatorService', () => {
    let service: NetYieldCalculatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NetYieldCalculatorService],
        }).compile();

        service = module.get(NetYieldCalculatorService);
    });

    it('calculateNetFunding: net = funding% - fees - slippage', () => {
        const result = service.calculateNetFunding(0.001, 0.001, 0.0005, 0.0005);
        expect(result.feesPercent).toBeCloseTo(0.3, 4);
        expect(result.slippagePercent).toBeCloseTo(0.05, 4);
        expect(result.netFundingPercent).toBeCloseTo(0.1 - 0.3 - 0.05, 4);
    });

    it('calculateNetBasis: net = basis - fees - slippage', () => {
        const result = service.calculateNetBasis(2.0, 0.001, 0.0005, 0.0005);
        expect(result.netBasisPercent).toBeCloseTo(2.0 - 0.3 - 0.05, 4);
    });

    it('isValidOpportunity: false при net <= 0', () => {
        expect(service.isValidOpportunity(0.01)).toBe(true);
        expect(service.isValidOpportunity(0)).toBe(false);
        expect(service.isValidOpportunity(-1)).toBe(false);
    });

    it('calculateProfitUsd: positionSize * net / 100', () => {
        expect(service.calculateProfitUsd(10_000, 0.5)).toBeCloseTo(50, 2);
    });

    it('calculateFundingApr: теоретический APR', () => {
        const apr = service.calculateFundingApr(0.01, 8);
        expect(apr).not.toBeNull();
        expect(apr!).toBeCloseTo(0.01 * 3 * 365, 2);
    });

    it('calculateNetYield через DTO', () => {
        const net = service.calculateNetYield({
            exchange: ExchangeEnum.BINANCE,
            symbol: 'BTC/USDT',
            grossYieldPercent: 1.5,
            spotFeeRate: 0.001,
            futuresFeeRate: 0.0005,
            estimatedSlippage: 0.0005,
            spreadPercent: 0.1,
        });
        expect(net).toBeCloseTo(1.5 - 0.3 - 0.05 - 0.1, 4);
    });
});
