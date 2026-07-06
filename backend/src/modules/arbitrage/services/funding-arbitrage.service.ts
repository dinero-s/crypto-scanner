import { Injectable } from '@nestjs/common';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import { FundingOpportunityDto } from '../dto/arbitrage-opportunity.dto';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { ArbitrageRepository } from '../repositories/arbitrage.repository';
import { ArbitrageCalculationService } from './arbitrage-calculation.service';
import { ArbitrageFilterService } from './arbitrage-filter.service';
import { ArbitrageService } from './arbitrage.service';

/** Расчёт Funding Rate арбитража */
@Injectable()
export class FundingArbitrageService {
    constructor(
        private readonly calculationService: ArbitrageCalculationService,
        private readonly filterService: ArbitrageFilterService,
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly arbitrageService: ArbitrageService,
    ) {}

    /** Пересчитать funding opportunities */
    async recalculate(): Promise<number> {
        const nowMs = Date.now();
        const config = this.filterService.getFilterConfig();
        const data = await this.calculationService.loadMarketData();
        const opportunities = this.calculationService.calculateFundingOpportunities(
            data,
            config,
            nowMs,
        );

        const saved = await this.arbitrageRepository.replaceByType(
            ArbitrageTypeEnum.FUNDING,
            opportunities,
            nowMs,
        );

        return saved;
    }

    /** Получить список funding opportunities */
    async findOpportunities(query: ArbitrageQueryDto): Promise<FundingOpportunityDto[]> {
        return this.arbitrageService.findFundingOpportunities({
            ...query,
            type: ArbitrageTypeEnum.FUNDING,
        });
    }
}
