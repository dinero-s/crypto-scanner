import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/app/constants/app.public.contstant';
import { OpportunitiesQueryDto } from '../dto/mini-app.dto';
import { MiniAppApiService } from '../services/mini-app-api.service';

/** REST API для Telegram Mini App frontend */
@ApiTags('Mini App')
@Public()
@Controller('mini-app')
export class MiniAppController {
    constructor(private readonly miniAppApiService: MiniAppApiService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Сводка сканера для главного экрана' })
    @ApiResponse({ status: 200, description: 'Dashboard data' })
    async getDashboard() {
        return this.miniAppApiService.getDashboard();
    }

    @Get('opportunities/funding')
    @ApiOperation({ summary: 'Funding Rate opportunities' })
    @ApiResponse({ status: 200, description: 'Список funding opportunities' })
    async getFundingOpportunities(@Query() query: OpportunitiesQueryDto) {
        return this.miniAppApiService.getFundingOpportunities(query);
    }

    @Get('opportunities/cash-carry')
    @ApiOperation({ summary: 'Cash & Carry opportunities' })
    @ApiResponse({ status: 200, description: 'Список cash & carry opportunities' })
    async getCashCarryOpportunities(@Query() query: OpportunitiesQueryDto) {
        return this.miniAppApiService.getCashCarryOpportunities(query);
    }

    @Get('exchanges')
    @ApiOperation({ summary: 'Список поддерживаемых бирж' })
    @ApiResponse({ status: 200, description: 'Биржи и capabilities' })
    async getExchanges() {
        return this.miniAppApiService.getExchanges();
    }

    @Get('health')
    @ApiOperation({ summary: 'Статус сканера (collectors, data freshness)' })
    @ApiResponse({ status: 200, description: 'Scanner health' })
    async getScannerHealth() {
        return this.miniAppApiService.getScannerHealth();
    }
}
