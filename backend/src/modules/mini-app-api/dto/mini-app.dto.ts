import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';

/** Запрос возможностей для Mini App dashboard */
export class OpportunitiesQueryDto {
    @ApiPropertyOptional({ description: 'Тип арбитража', enum: ArbitrageTypeEnum })
    @IsOptional()
    @IsEnum(ArbitrageTypeEnum)
    type?: ArbitrageTypeEnum;

    @ApiPropertyOptional({ description: 'Биржа', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Минимальный net yield (%)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minNetYieldPct?: number;

    @ApiPropertyOptional({ description: 'Лимит', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

/** Сводка dashboard */
export class ScannerDashboardDto {
    @ApiPropertyOptional({ description: 'Количество funding opportunities' })
    fundingCount: number;

    @ApiPropertyOptional({ description: 'Количество cash & carry opportunities' })
    cashCarryCount: number;

    @ApiPropertyOptional({ description: 'Время последнего обновления (unix ms)' })
    lastUpdatedAt: number | null;

    @ApiPropertyOptional({ description: 'Статус коллекторов' })
    collectorsHealthy: boolean;
}
