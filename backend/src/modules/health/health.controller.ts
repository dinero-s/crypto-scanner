import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from 'src/app/constants/app.public.contstant';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { DatabaseConnection } from 'src/common/database/decorators/database.decorator';
import { ExchangeHealthResponseDto } from 'src/modules/market-data/dto/latest-market-data.dto';
import { ExchangeHealthService } from 'src/modules/market-data/services/exchange-health.service';
import { ScannerHealthService } from './services/scanner-health.service';

/** Healthchecks: liveness / readiness (MongoDB + Redis + collectors) */
@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
    constructor(
        @DatabaseConnection() private readonly mongo: Connection,
        private readonly config: ConfigService,
        private readonly scannerHealth: ScannerHealthService,
        private readonly exchangeHealth: ExchangeHealthService,
    ) {}

    /** Liveness: приложение запущено */
    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiResponse({ status: 200, description: 'OK' })
    live(): { status: string } {
        return { status: 'ok' };
    }

    /** Readiness: MongoDB + Redis доступны */
    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe (MongoDB, Redis, collectors)' })
    @ApiResponse({ status: 200, description: 'OK' })
    @ApiResponse({ status: 503, description: 'Service Unavailable' })
    async ready(): Promise<{
        status: string;
        mongo: string;
        redis: string;
        collectors: string;
    }> {
        const state = this.mongo.readyState;
        const mongoOk = state === 1;
        if (!mongoOk) {
            throw new ServiceUnavailableException(
                `MongoDB not ready (state: ${String(state)})`,
            );
        }

        const redis = new Redis({
            host: this.config.get<string>('redis.host') ?? 'localhost',
            port: this.config.get<number>('redis.port') ?? 6379,
            password: this.config.get<string>('redis.password'),
            db: this.config.get<number>('redis.db') ?? 0,
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
        });

        try {
            await redis.ping();
            redis.disconnect();
        } catch (err) {
            redis.disconnect();
            throw new ServiceUnavailableException(
                `Redis not ready: ${err instanceof Error ? err.message : String(err)}`,
            );
        }

        const collectors = await this.scannerHealth.getCollectorsHealth();
        if (!collectors.healthy) {
            throw new ServiceUnavailableException('Collectors not healthy');
        }

        return {
            status: 'ok',
            mongo: 'connected',
            redis: 'connected',
            collectors: 'healthy',
        };
    }

    /** Детальный статус scanner collectors */
    @Get('scanner')
    @ApiOperation({ summary: 'Статус scanner collectors' })
    @ApiResponse({ status: 200, description: 'Scanner health details' })
    async scannerHealthCheck() {
        return this.scannerHealth.getCollectorsHealth();
    }

    /** Статус доступности бирж */
    @Get('exchanges')
    @ApiOperation({ summary: 'Статус доступности бирж (Redis / Mongo)' })
    @ApiResponse({ status: 200, type: [ExchangeHealthResponseDto] })
    async exchangesHealth(): Promise<ExchangeHealthResponseDto[]> {
        const statuses = await this.exchangeHealth.getAllStatuses();
        return statuses.map((s) => ({
            exchange: s.exchange,
            healthy: s.healthy,
            lastCheckedAt: s.lastCheckedAt.toISOString(),
            lastSuccessAt: s.lastSuccessAt?.toISOString(),
            lastError: s.lastError,
            latencyMs: s.latencyMs,
        }));
    }
}
