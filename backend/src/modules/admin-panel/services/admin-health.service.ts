import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { DatabaseConnection } from 'src/common/database/decorators/database.decorator';
import { QUEUE_NAMES } from 'src/common/queue/constants/queue.constant';
import { OzonConnectionService } from 'src/modules/ozon/integration/services/ozon-connection.service';
import { HealthServiceStatus } from '../enums/admin-panel.enum';
import { AdminHealthResponseDto, AdminHealthServiceDto } from '../dto/admin-health.dto';

/** Admin health API */
@Injectable()
export class AdminHealthService {
    constructor(
        @DatabaseConnection()
        private readonly mongo: Connection,
        @InjectQueue(QUEUE_NAMES.OZON_SYNC)
        private readonly syncQueue: Queue,
        private readonly configService: ConfigService,
        private readonly ozonConnectionService: OzonConnectionService,
    ) {}

    async getHealth(): Promise<AdminHealthResponseDto> {
        const checkedAt = new Date().toISOString();

        const [mongo, redis, bullmq, mailer, telegram, sentry, llm, ozonApi] =
            await Promise.all([
                this.checkMongo(checkedAt),
                this.checkRedis(checkedAt),
                this.checkBullmq(checkedAt),
                this.checkMailer(checkedAt),
                this.checkTelegram(checkedAt),
                this.checkSentry(checkedAt),
                this.checkLlm(checkedAt),
                this.checkOzonApi(checkedAt),
            ]);

        return {
            backend: {
                status: HealthServiceStatus.OK,
                message: 'Backend работает',
                checkedAt,
            },
            mongo,
            redis,
            bullmq,
            mailer,
            telegram,
            sentry,
            llm,
            ozonApi,
        };
    }

    private async checkMongo(checkedAt: string): Promise<AdminHealthServiceDto> {
        const ok = this.mongo.readyState === 1;
        return {
            status: ok ? HealthServiceStatus.OK : HealthServiceStatus.DOWN,
            message: ok ? 'MongoDB connected' : `MongoDB state=${String(this.mongo.readyState)}`,
            checkedAt,
        };
    }

    private async checkRedis(checkedAt: string): Promise<AdminHealthServiceDto> {
        const redis = new Redis({
            host: this.configService.get<string>('redis.host') ?? 'localhost',
            port: this.configService.get<number>('redis.port') ?? 6379,
            password: this.configService.get<string>('redis.password'),
            db: this.configService.get<number>('redis.db') ?? 0,
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
        });
        try {
            await redis.ping();
            redis.disconnect();
            return {
                status: HealthServiceStatus.OK,
                message: 'Redis connected',
                checkedAt,
            };
        } catch (err) {
            redis.disconnect();
            return {
                status: HealthServiceStatus.DOWN,
                message: err instanceof Error ? err.message : 'Redis unavailable',
                checkedAt,
            };
        }
    }

    private async checkBullmq(checkedAt: string): Promise<AdminHealthServiceDto> {
        try {
            await this.syncQueue.getJobCounts();
            return {
                status: HealthServiceStatus.OK,
                message: 'BullMQ доступен',
                checkedAt,
            };
        } catch (err) {
            return {
                status: HealthServiceStatus.DOWN,
                message: err instanceof Error ? err.message : 'BullMQ unavailable',
                checkedAt,
            };
        }
    }

    private checkMailer(checkedAt: string): AdminHealthServiceDto {
        const enabled =
            this.configService.get<boolean>('ozon.alerts.emailEnabled') === true;
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        if (!enabled) {
            return {
                status: HealthServiceStatus.UNKNOWN,
                message: 'Email alerts отключены',
                checkedAt,
            };
        }
        return {
            status: smtpHost ? HealthServiceStatus.OK : HealthServiceStatus.DEGRADED,
            message: smtpHost ? 'SMTP настроен' : 'SMTP не настроен',
            checkedAt,
        };
    }

    private checkTelegram(checkedAt: string): AdminHealthServiceDto {
        const enabled =
            this.configService.get<boolean>('ozon.alerts.telegramEnabled') === true;
        const token = this.configService.get<string>('ozon.alerts.telegramBotToken');
        if (!enabled) {
            return {
                status: HealthServiceStatus.UNKNOWN,
                message: 'Telegram alerts отключены',
                checkedAt,
            };
        }
        return {
            status: token ? HealthServiceStatus.OK : HealthServiceStatus.DEGRADED,
            message: token ? 'Telegram bot token задан' : 'Telegram token не задан',
            checkedAt,
        };
    }

    private checkSentry(checkedAt: string): AdminHealthServiceDto {
        const dsn = this.configService.get<string>('SENTRY_DSN');
        return {
            status: dsn ? HealthServiceStatus.OK : HealthServiceStatus.UNKNOWN,
            message: dsn ? 'Sentry DSN задан' : 'Sentry не настроен',
            checkedAt,
        };
    }

    private checkLlm(checkedAt: string): AdminHealthServiceDto {
        const enabled = this.configService.get<boolean>('ozon.ai.enabled') === true;
        if (!enabled) {
            return {
                status: HealthServiceStatus.UNKNOWN,
                message: 'LLM advisor отключён',
                checkedAt,
            };
        }
        const apiKey = this.configService.get<string>('ozon.ai.apiKey');
        return {
            status: apiKey ? HealthServiceStatus.OK : HealthServiceStatus.DEGRADED,
            message: apiKey ? 'LLM API key задан' : 'LLM API key не задан',
            checkedAt,
        };
    }

    private async checkOzonApi(checkedAt: string): Promise<AdminHealthServiceDto> {
        try {
            const active = await this.ozonConnectionService.findAllActive();
            if (active.length === 0) {
                return {
                    status: HealthServiceStatus.UNKNOWN,
                    message: 'Нет активных подключений для проверки Ozon API',
                    checkedAt,
                };
            }
            const sample = active[0];
            const result = await this.ozonConnectionService.healthCheckAdmin(sample.id);
            return {
                status: result.healthy ? HealthServiceStatus.OK : HealthServiceStatus.DEGRADED,
                message: result.healthy
                    ? 'Ozon API health check успешен'
                    : `Ozon API status=${result.status}`,
                checkedAt,
                lastSuccessAt: result.healthy ? checkedAt : undefined,
            };
        } catch (err) {
            return {
                status: HealthServiceStatus.DOWN,
                message: err instanceof Error ? err.message : 'Ozon API check failed',
                checkedAt,
                lastErrorAt: checkedAt,
            };
        }
    }
}
