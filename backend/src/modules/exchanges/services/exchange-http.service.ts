import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ExchangeEnum } from '../enums/exchange.enum';
import { ExchangeApiError } from '../errors/exchange-api.error';
import { ExchangeRateLimiterService } from './exchange-rate-limiter.service';

interface ExchangeHttpConfig {
    timeoutMs: number;
    retryMaxAttempts: number;
    retryDelayMs: number;
    rateLimitIntervalMs: number;
}

/** HTTP-клиент для public API бирж: timeout, retry, rate limit */
@Injectable()
export class ExchangeHttpService {
    private readonly logger = new Logger(ExchangeHttpService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly rateLimiter: ExchangeRateLimiterService,
    ) {}

    async get<T>(
        exchange: ExchangeEnum,
        url: string,
        params?: Record<string, string | number | boolean>,
    ): Promise<T> {
        const config = this.getHttpConfig();
        let lastError: ExchangeApiError | undefined;

        for (let attempt = 1; attempt <= config.retryMaxAttempts; attempt += 1) {
            try {
                await this.rateLimiter.acquire(exchange, config.rateLimitIntervalMs);

                const response = await firstValueFrom(
                    this.httpService.get<T>(url, {
                        params,
                        timeout: config.timeoutMs,
                        validateStatus: (status) => status >= 200 && status < 300,
                    }),
                );

                return response.data;
            } catch (error) {
                lastError = this.toExchangeApiError(exchange, url, error);

                if (attempt < config.retryMaxAttempts && this.isRetryable(lastError)) {
                    const delayMs = config.retryDelayMs * attempt;
                    this.logger.warn(
                        `exchange=${exchange} endpoint=${url} attempt=${String(attempt)} retryInMs=${String(delayMs)} message=${lastError.message}`,
                    );
                    await this.sleep(delayMs);
                    continue;
                }

                throw lastError;
            }
        }

        throw lastError ?? new ExchangeApiError(exchange, url, 'Unknown HTTP error');
    }

    private getHttpConfig(): ExchangeHttpConfig {
        return {
            timeoutMs: this.configService.get<number>('exchanges.requestTimeoutMs') ?? 10_000,
            retryMaxAttempts:
                this.configService.get<number>('exchanges.retryMaxAttempts') ?? 3,
            retryDelayMs: this.configService.get<number>('exchanges.retryDelayMs') ?? 500,
            rateLimitIntervalMs:
                this.configService.get<number>('exchanges.rateLimitIntervalMs') ?? 100,
        };
    }

    private isRetryable(error: ExchangeApiError): boolean {
        if (error.statusCode === undefined) {
            return true;
        }

        return error.statusCode >= 500 || error.statusCode === 429;
    }

    private toExchangeApiError(
        exchange: ExchangeEnum,
        endpoint: string,
        error: unknown,
    ): ExchangeApiError {
        if (error instanceof ExchangeApiError) {
            return error;
        }

        if (isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const statusCode = axiosError.response?.status;
            const responseMessage = this.extractAxiosMessage(axiosError);
            const message = responseMessage ?? axiosError.message;

            return new ExchangeApiError(
                exchange,
                endpoint,
                message,
                statusCode,
                error,
            );
        }

        if (error instanceof Error) {
            return new ExchangeApiError(exchange, endpoint, error.message, undefined, error);
        }

        return new ExchangeApiError(exchange, endpoint, 'Unknown error', undefined, error);
    }

    private extractAxiosMessage(error: AxiosError): string | undefined {
        const data = error.response?.data;

        if (typeof data === 'string' && data.length > 0) {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            const record = data as Record<string, unknown>;
            if (typeof record.msg === 'string') {
                return record.msg;
            }
            if (typeof record.message === 'string') {
                return record.message;
            }
        }

        return undefined;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
