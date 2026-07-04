import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { MarketDataModule } from '../market-data/market-data.module';
import {
    ArbitrageOpportunityEntity,
    ArbitrageOpportunitySchema,
} from './entities/arbitrage-opportunity.entity';
import { ArbitrageRepository } from './repositories/arbitrage.repository';
import { CashCarryArbitrageService } from './services/cash-carry-arbitrage.service';
import { FundingArbitrageService } from './services/funding-arbitrage.service';
import { NetYieldCalculatorService } from './services/net-yield-calculator.service';

/** Модуль расчёта арбитражных возможностей */
@Module({
    imports: [
        MarketDataModule,
        MongooseModule.forFeature(
            [{ name: ArbitrageOpportunityEntity.name, schema: ArbitrageOpportunitySchema }],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        ArbitrageRepository,
        NetYieldCalculatorService,
        FundingArbitrageService,
        CashCarryArbitrageService,
    ],
    exports: [
        ArbitrageRepository,
        FundingArbitrageService,
        CashCarryArbitrageService,
        NetYieldCalculatorService,
    ],
})
export class ArbitrageModule {}
