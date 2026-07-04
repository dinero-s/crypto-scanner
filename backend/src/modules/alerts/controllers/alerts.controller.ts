import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateAlertSettingsDto, AlertSettingsResponseDto } from '../dto/alert-settings.dto';
import { AlertsService } from '../services/alerts.service';

/** REST: настройки алертов (Mini App / user) */
@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get('settings')
    @ApiOperation({ summary: 'Получить настройки алертов' })
    @ApiResponse({ status: 200, description: 'Настройки алертов' })
    async getSettings(@CurrentUser('id') userId: Types.ObjectId): Promise<AlertSettingsResponseDto> {
        return this.alertsService.getSettings(userId);
    }

    @Patch('settings')
    @ApiOperation({ summary: 'Обновить настройки алертов' })
    @ApiResponse({ status: 200, description: 'Настройки обновлены' })
    async updateSettings(
        @CurrentUser('id') userId: Types.ObjectId,
        @Body() dto: UpdateAlertSettingsDto,
    ): Promise<AlertSettingsResponseDto> {
        return this.alertsService.updateSettings(userId, dto);
    }
}
