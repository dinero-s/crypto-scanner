import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';

/** Фильтр арбитражных возможностей */
export class ArbitrageQueryDto {
    @ApiPropertyOptional({ description: 'Тип арбитража', enum: ArbitrageTypeEnum })
    @IsOptional()
    @IsEnum(ArbitrageTypeEnum)
    type?: ArbitrageTypeEnum;

    @ApiPropertyOptional({ description: 'Биржа', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Символ' })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Минимальный net yield (%)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minNetYieldPct?: number;

    @ApiPropertyOptional({ description: 'Лимит', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 50;
}
