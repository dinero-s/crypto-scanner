import { Injectable, Logger } from '@nestjs/common';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import { CashCarryOpportunityDto } from '../dto/arbitrage-opportunity.dto';
import { ArbitrageRepository } from '../repositories/arbitrage.repository';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { NetYieldCalculatorService } from './net-yield-calculator.service';

/** Расчёт Cash & Carry / Spot-Futures арбитража */
@Injectable()
export class CashCarryArbitrageService {
    private readonly logger = new Logger(CashCarryArbitrageService.name);

    constructor(
        private readonly arbitrageRepository: ArbitrageRepository,
        private readonly netYieldCalculator: NetYieldCalculatorService,
    ) {}

    /** Пересчитать cash & carry opportunities */
    async recalculate(): Promise<void> {
        this.logger.log('recalculate cash & carry — заглушка');
    }

    /** Получить список cash & carry opportunities */
    async findOpportunities(query: ArbitrageQueryDto): Promise<CashCarryOpportunityDto[]> {
        const rows = await this.arbitrageRepository.findByQuery({
            ...query,
            type: ArbitrageTypeEnum.CASH_AND_CARRY,
        });
        return rows.map((row) => ({
            symbol: row.symbol,
            exchange: row.exchange,
            basisPct: row.basisPct ?? 0,
            netYieldPct: row.netYieldPct,
        }));
    }
}
