import { Injectable, Logger } from '@nestjs/common';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import { FundingOpportunityDto } from '../dto/arbitrage-opportunity.dto';
import { ArbitrageRepository } from '../repositories/arbitrage.repository';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { NetYieldCalculatorService } from './net-yield-calculator.service';

/** Расчёт Funding Rate арбитража */
@Injectable()
export class FundingArbitrageService {
    private readonly logger = new Logger(FundingArbitrageService.name);

    constructor(
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly netYieldCalculator: NetYieldCalculatorService,
    ) {}

    /** Пересчитать funding opportunities */
    async recalculate(): Promise<void> {
        this.logger.log('recalculate funding opportunities — заглушка');
    }

    /** Получить список funding opportunities */
    async findOpportunities(query: ArbitrageQueryDto): Promise<FundingOpportunityDto[]> {
        const rows = await this.arbitrageRepository.findByQuery({
            ...query,
            type: ArbitrageTypeEnum.FUNDING_RATE,
        });
        return rows.map((row) => ({
            symbol: row.symbol,
            exchange: row.exchange,
            direction: row.direction!,
            fundingRate: row.fundingRate ?? 0,
            netYieldPct: row.netYieldPct,
        }));
    }
}
