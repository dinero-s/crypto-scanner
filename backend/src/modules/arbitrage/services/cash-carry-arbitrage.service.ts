import { Injectable } from '@nestjs/common';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import { CashCarryOpportunityDto } from '../dto/arbitrage-opportunity.dto';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { ArbitrageRepository } from '../repositories/arbitrage.repository';
import { ArbitrageCalculationService } from './arbitrage-calculation.service';
import { ArbitrageFilterService } from './arbitrage-filter.service';
import { ArbitrageService } from './arbitrage.service';

/** Расчёт Cash & Carry / Spot-Futures арбитража */
@Injectable()
export class CashCarryArbitrageService {
    constructor(
        private readonly calculationService: ArbitrageCalculationService,
        private readonly filterService: ArbitrageFilterService,
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly arbitrageService: ArbitrageService,
    ) {}

    /** Пересчитать cash & carry opportunities */
    async recalculate(): Promise<number> {
        const nowMs = Date.now();
        const config = this.filterService.getFilterConfig();
        const data = await this.calculationService.loadMarketData();
        const opportunities = this.calculationService.calculateCashCarryOpportunities(
            data,
            config,
            nowMs,
        );

        const saved = await this.arbitrageRepository.replaceByType(
            ArbitrageTypeEnum.CASH_CARRY,
            opportunities,
            nowMs,
        );

        return saved;
    }

    /** Получить список cash & carry opportunities */
    async findOpportunities(query: ArbitrageQueryDto): Promise<CashCarryOpportunityDto[]> {
        return this.arbitrageService.findCashCarryOpportunities({
            ...query,
            type: ArbitrageTypeEnum.CASH_CARRY,
        });
    }
}
