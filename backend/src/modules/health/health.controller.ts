import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from 'src/app/constants/app.public.contstant';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { DatabaseConnection } from 'src/common/database/decorators/database.decorator';

/** Healthchecks: liveness / readiness (MongoDB + Redis для BullMQ) */
@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
    constructor(
        @DatabaseConnection() private readonly mongo: Connection,
        private readonly config: ConfigService,
    ) {}

    /** Liveness: приложение запущено */
    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiResponse({ status: 200, description: 'OK' })
    live(): { status: string } {
        return { status: 'ok' };
    }

    /** Readiness: MongoDB + Redis доступны (TZ п.8) */
    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe (MongoDB, Redis)' })
    @ApiResponse({ status: 200, description: 'OK' })
    @ApiResponse({ status: 503, description: 'Service Unavailable' })
    async ready(): Promise<{ status: string; mongo: string; redis: string }> {
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
            return { status: 'ok', mongo: 'connected', redis: 'connected' };
        } catch (err) {
            redis.disconnect();
            throw new ServiceUnavailableException(
                `Redis not ready: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }
}
