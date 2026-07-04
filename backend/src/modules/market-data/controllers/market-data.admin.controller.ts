import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    FundingRateResponseDto,
    LatestMarketDataQueryDto,
    PerpTickerResponseDto,
    SpotTickerResponseDto,
} from '../dto/latest-market-data.dto';
import { MarketDataQueryService } from '../services/market-data-query.service';

/** Admin API: latest market data */
@ApiTags('Admin Market Data')
@ApiBearerAuth()
@Controller('market-data')
export class MarketDataAdminController {
    constructor(private readonly marketDataQuery: MarketDataQueryService) {}

    @Get('latest/spot')
    @ApiOperation({ summary: 'Latest spot-тикеры из Redis-кэша' })
    @ApiResponse({ status: 200, type: [SpotTickerResponseDto] })
    async getLatestSpot(
        @Query() query: LatestMarketDataQueryDto,
    ): Promise<SpotTickerResponseDto[]> {
        return this.marketDataQuery.getLatestSpot(query);
    }

    @Get('latest/perp')
    @ApiOperation({ summary: 'Latest perp-тикеры из Redis-кэша' })
    @ApiResponse({ status: 200, type: [PerpTickerResponseDto] })
    async getLatestPerp(
        @Query() query: LatestMarketDataQueryDto,
    ): Promise<PerpTickerResponseDto[]> {
        return this.marketDataQuery.getLatestPerp(query);
    }

    @Get('latest/funding')
    @ApiOperation({ summary: 'Latest funding rates из Redis-кэша' })
    @ApiResponse({ status: 200, type: [FundingRateResponseDto] })
    async getLatestFunding(
        @Query() query: LatestMarketDataQueryDto,
    ): Promise<FundingRateResponseDto[]> {
        return this.marketDataQuery.getLatestFunding(query);
    }
}
