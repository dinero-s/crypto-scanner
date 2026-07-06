import { Injectable, NotFoundException } from '@nestjs/common';
import { ArbitrageQueryDto, ArbitrageTopQueryDto } from '../dto/arbitrage-query.dto';
import {
    ArbitrageOpportunityDetailDto,
    ArbitrageStatsDto,
    CashCarryOpportunityDto,
    FundingOpportunityDto,
} from '../dto/arbitrage-opportunity.dto';
import {
    ArbitrageOpportunityDoc,
    ArbitrageOpportunityMetadata,
} from '../entities/arbitrage-opportunity.entity';
import { ArbitrageTypeEnum, FundingDirectionEnum } from '../enums/arbitrage-type.enum';
import { ArbitrageRepository } from '../repositories/arbitrage.repository';

/** Основной сервис API арбитража */
@Injectable()
export class ArbitrageService {
    constructor(private readonly arbitrageRepository: ArbitrageRepository) {}

    /** Funding opportunities */
    async findFundingOpportunities(query: ArbitrageQueryDto): Promise<FundingOpportunityDto[]> {
        const rows = await this.arbitrageRepository.findByQuery({
            ...query,
            type: ArbitrageTypeEnum.FUNDING,
        });
        return rows.map((row) => this.toFundingDto(row));
    }

    /** Cash & carry opportunities */
    async findCashCarryOpportunities(
        query: ArbitrageQueryDto,
    ): Promise<CashCarryOpportunityDto[]> {
        const rows = await this.arbitrageRepository.findByQuery({
            ...query,
            type: ArbitrageTypeEnum.CASH_CARRY,
        });
        return rows.map((row) => this.toCashCarryDto(row));
    }

    /** Top opportunities */
    async findTop(query: ArbitrageTopQueryDto): Promise<ArbitrageOpportunityDetailDto[]> {
        const rows = await this.arbitrageRepository.findTop(
            query.limit ?? 10,
            query.type,
        );
        return rows.map((row) => this.toDetailDto(row));
    }

    /** Opportunity по ID */
    async findById(id: string): Promise<ArbitrageOpportunityDetailDto> {
        const row = await this.arbitrageRepository.findById(id);
        if (!row) {
            throw new NotFoundException('Арбитражная возможность не найдена');
        }
        return this.toDetailDto(row);
    }

    /** Статистика */
    async getStats(): Promise<ArbitrageStatsDto> {
        return this.arbitrageRepository.getStats();
    }

    private toFundingDto(row: ArbitrageOpportunityDoc): FundingOpportunityDto {
        const meta = this.parseMetadata(row.metadata);
        return {
            id: String(row._id),
            baseAsset: row.baseAsset,
            quoteAsset: row.quoteAsset,
            spotExchange: row.spotExchange,
            futuresExchange: row.futuresExchange,
            spotSymbol: row.spotSymbol,
            futuresSymbol: row.futuresSymbol,
            direction: meta.direction ?? FundingDirectionEnum.LONG_SPOT_SHORT_PERP,
            fundingRate: row.fundingRate ?? 0,
            predictedFundingRate: row.predictedFundingRate,
            nextFundingTime: row.nextFundingTime,
            timeToFundingMinutes: meta.timeToFundingMinutes,
            spotAsk: row.spotPrice,
            perpBid: row.futuresPrice,
            spotPerpSpreadPercent: meta.spotPerpSpreadPercent ?? 0,
            estimatedFeesPercent: meta.estimatedFeesPercent ?? 0,
            estimatedSlippagePercent: meta.estimatedSlippagePercent ?? 0,
            netFundingPercent: row.netYieldPercent,
            estimatedNetProfitUsd: row.estimatedProfitUsd,
            theoreticalApr: row.annualizedApr,
            isTheoreticalApr: meta.isTheoreticalApr ?? true,
            riskScore: row.riskScore,
            opportunityScore: row.opportunityScore,
            calculatedAt: row.calculatedAt,
        };
    }

    private toCashCarryDto(row: ArbitrageOpportunityDoc): CashCarryOpportunityDto {
        const meta = this.parseMetadata(row.metadata);
        const isTheoretical = meta.isTheoreticalApr ?? true;
        return {
            id: String(row._id),
            baseAsset: row.baseAsset,
            quoteAsset: row.quoteAsset,
            spotExchange: row.spotExchange,
            futuresExchange: row.futuresExchange,
            spotSymbol: row.spotSymbol,
            futuresSymbol: row.futuresSymbol,
            spotAsk: row.spotPrice,
            perpBid: row.futuresPrice,
            basisPercent: row.basisPercent ?? 0,
            estimatedFeesPercent: meta.estimatedFeesPercent ?? 0,
            estimatedSlippagePercent: meta.estimatedSlippagePercent ?? 0,
            netBasisPercent: row.netYieldPercent,
            annualizedApr: isTheoretical ? undefined : row.annualizedApr,
            theoreticalApr: isTheoretical ? row.annualizedApr : undefined,
            isTheoreticalApr: isTheoretical,
            riskScore: row.riskScore,
            opportunityScore: row.opportunityScore,
            calculatedAt: row.calculatedAt,
        };
    }

    private toDetailDto(row: ArbitrageOpportunityDoc): ArbitrageOpportunityDetailDto {
        const meta = this.parseMetadata(row.metadata);
        return {
            id: String(row._id),
            type: row.type,
            baseAsset: row.baseAsset,
            quoteAsset: row.quoteAsset,
            spotExchange: row.spotExchange,
            futuresExchange: row.futuresExchange,
            spotSymbol: row.spotSymbol,
            futuresSymbol: row.futuresSymbol,
            spotPrice: row.spotPrice,
            futuresPrice: row.futuresPrice,
            fundingRate: row.fundingRate,
            predictedFundingRate: row.predictedFundingRate,
            basisPercent: row.basisPercent,
            netYieldPercent: row.netYieldPercent,
            estimatedProfitUsd: row.estimatedProfitUsd,
            annualizedApr: row.annualizedApr,
            opportunityScore: row.opportunityScore,
            riskScore: row.riskScore,
            nextFundingTime: row.nextFundingTime,
            expiresAt: row.expiresAt,
            calculatedAt: row.calculatedAt,
            metadata: meta as Record<string, number | string | boolean>,
        };
    }

    private parseMetadata(metadata: ArbitrageOpportunityMetadata): ArbitrageOpportunityMetadata {
        return metadata ?? {};
    }
}
