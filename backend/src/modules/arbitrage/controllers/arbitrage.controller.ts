import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/app/constants/app.public.contstant';
import { ArbitrageQueryDto, ArbitrageTopQueryDto } from '../dto/arbitrage-query.dto';
import {
    ArbitrageOpportunityDetailDto,
    ArbitrageStatsDto,
    CashCarryOpportunityDto,
    FundingOpportunityDto,
} from '../dto/arbitrage-opportunity.dto';
import { ArbitrageService } from '../services/arbitrage.service';

/** Публичный REST API арбитражных возможностей */
@ApiTags('Arbitrage')
@Public()
@Controller('arbitrage')
export class ArbitrageController {
    constructor(private readonly arbitrageService: ArbitrageService) {}

    @Get('funding')
    @ApiOperation({ summary: 'Funding Rate арбитражные возможности' })
    @ApiResponse({ status: 200, description: 'Список funding opportunities', type: [FundingOpportunityDto] })
    async getFunding(@Query() query: ArbitrageQueryDto): Promise<FundingOpportunityDto[]> {
        return this.arbitrageService.findFundingOpportunities(query);
    }

    @Get('cash-carry')
    @ApiOperation({ summary: 'Cash & Carry арбитражные возможности' })
    @ApiResponse({ status: 200, description: 'Список cash & carry opportunities', type: [CashCarryOpportunityDto] })
    async getCashCarry(@Query() query: ArbitrageQueryDto): Promise<CashCarryOpportunityDto[]> {
        return this.arbitrageService.findCashCarryOpportunities(query);
    }

    @Get('top')
    @ApiOperation({ summary: 'Top арбитражные возможности по opportunityScore' })
    @ApiResponse({ status: 200, description: 'Top opportunities', type: [ArbitrageOpportunityDetailDto] })
    async getTop(@Query() query: ArbitrageTopQueryDto): Promise<ArbitrageOpportunityDetailDto[]> {
        return this.arbitrageService.findTop(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Статистика арбитражных возможностей' })
    @ApiResponse({ status: 200, description: 'Stats', type: ArbitrageStatsDto })
    async getStats(): Promise<ArbitrageStatsDto> {
        return this.arbitrageService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Арбитражная возможность по ID' })
    @ApiResponse({ status: 200, description: 'Opportunity detail', type: ArbitrageOpportunityDetailDto })
    async getById(@Param('id') id: string): Promise<ArbitrageOpportunityDetailDto> {
        return this.arbitrageService.findById(id);
    }
}
