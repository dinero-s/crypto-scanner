import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketDataModule } from '../market-data/market-data.module';
import { HealthController } from './health.controller';
import { ScannerHealthService } from './services/scanner-health.service';

/** Healthchecks: liveness / readiness + scanner collectors */
@Module({
    imports: [ConfigModule, MarketDataModule],
    controllers: [HealthController],
    providers: [ScannerHealthService],
    exports: [ScannerHealthService],
})
export class HealthModule {}
