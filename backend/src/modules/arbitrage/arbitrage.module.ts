import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { MarketDataModule } from '../market-data/market-data.module';
import {
    ArbitrageOpportunityEntity,
    ArbitrageOpportunitySchema,
} from './entities/arbitrage-opportunity.entity';
import { ArbitrageRepository } from './repositories/arbitrage.repository';
import { ArbitrageCalculationService } from './services/arbitrage-calculation.service';
import { ArbitrageFilterService } from './services/arbitrage-filter.service';
import { ArbitrageScoringService } from './services/arbitrage-scoring.service';
import { ArbitrageService } from './services/arbitrage.service';
import { CashCarryArbitrageService } from './services/cash-carry-arbitrage.service';
import { FundingArbitrageService } from './services/funding-arbitrage.service';
import { NetYieldCalculatorService } from './services/net-yield-calculator.service';

/** Модуль расчёта арбитражных возможностей */
@Module({
    imports: [
        ConfigModule,
        MarketDataModule,
        MongooseModule.forFeature(
            [{ name: ArbitrageOpportunityEntity.name, schema: ArbitrageOpportunitySchema }],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        ArbitrageRepository,
        ArbitrageFilterService,
        ArbitrageScoringService,
        NetYieldCalculatorService,
        ArbitrageCalculationService,
        ArbitrageService,
        FundingArbitrageService,
        CashCarryArbitrageService,
    ],
    exports: [
        ArbitrageRepository,
        ArbitrageService,
        FundingArbitrageService,
        CashCarryArbitrageService,
        NetYieldCalculatorService,
        ArbitrageCalculationService,
    ],
})
export class ArbitrageModule {}
