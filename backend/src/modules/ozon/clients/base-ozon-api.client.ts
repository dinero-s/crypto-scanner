import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AllowedOzonApiService } from '../compliance/allowed-ozon-api.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { ComplianceLogEvent, OzonApiType } from '../constants/ozon.enums';
import { OzonApiRateLimiterService } from './ozon-api-rate-limiter.service';

export type OzonApiAuthMode = 'seller' | 'bearer' | 'none';

export interface OzonApiRequestOptions {
    apiType: OzonApiType;
    baseUrl: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    authMode?: OzonApiAuthMode;
    bearerToken?: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    userId?: string;
}

export interface OzonApiCredentials {
    clientId: string;
    apiKey: string;
}

/** Базовый HTTP-клиент Ozon с compliance guard и backoff при 429 */
export abstract class BaseOzonApiClient {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly httpService: HttpService,
        protected readonly configService: ConfigService,
        protected readonly allowedOzonApiService: AllowedOzonApiService,
        protected readonly complianceLog: ComplianceLogService,
        protected readonly rateLimiter: OzonApiRateLimiterService,
    ) {}

    protected async request<T>(
        options: OzonApiRequestOptions,
        credentials?: OzonApiCredentials,
    ): Promise<T> {
        this.allowedOzonApiService.assertAllowedRequest(
            options.apiType,
            options.baseUrl,
            options.path,
            options.userId,
        );

        const timeout =
            this.configService.get<number>('ozon.api.requestTimeoutMs') ?? 30_000;
        const maxRetries =
            this.configService.get<number>('ozon.api.maxRetries') ?? 3;
        const url = `${options.baseUrl.replace(/\/+$/, '')}${options.path}`;
        const headers = this.buildAuthHeaders(options, credentials);
        const rateLimitKey =
            credentials?.clientId ?? options.userId ?? 'ozon-global';
        await this.rateLimiter.acquire(rateLimitKey);

        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const response = await firstValueFrom(
                    this.httpService.request<T>({
                        url,
                        method: options.method,
                        headers,
                        data: options.body,
                        timeout,
                        validateStatus: (status) => status >= 200 && status < 500,
                    }),
                );

                if (response.status === 429) {
                    await this.handleRateLimit(
                        response.headers['retry-after'] as string | undefined,
                        options,
                        attempt,
                        maxRetries,
                    );
                    attempt += 1;
                    continue;
                }

                if (response.status >= 400) {
                    this.logger.warn(
                        `Ozon API error status=${String(response.status)} path=${options.path}`,
                    );
                }

                return response.data;
            } catch (error: unknown) {
                if (isAxiosError(error) && error.response?.status === 429) {
                    await this.handleRateLimit(
                        error.response.headers['retry-after'] as
                            | string
                            | undefined,
                        options,
                        attempt,
                        maxRetries,
                    );
                    attempt += 1;
                    continue;
                }

                this.logAxiosError(error, options.path);
                throw error;
            }
        }

        throw new Error(
            `Ozon API rate limit exceeded after retries path=${options.path}`,
        );
    }

    private async handleRateLimit(
        retryAfterHeader: string | undefined,
        options: OzonApiRequestOptions,
        attempt: number,
        maxRetries: number,
    ): Promise<void> {
        if (attempt >= maxRetries) {
            return;
        }

        const retryAfterMs = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10) * 1000
            : Math.min(60_000, 2 ** attempt * 1000);

        this.complianceLog.log({
            event: ComplianceLogEvent.RATE_LIMIT_BACKOFF,
            userId: options.userId,
            endpoint: options.path,
            details: `retryAfterMs=${String(retryAfterMs)} attempt=${String(attempt + 1)}`,
        });

        await this.sleep(retryAfterMs);
    }

    private logAxiosError(error: unknown, path: string): void {
        if (isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            this.logger.warn(
                `Ozon request failed path=${path} status=${String(status ?? 'unknown')} message=${axiosError.message}`,
            );
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Ozon request failed path=${path} message=${message}`);
    }

    private buildAuthHeaders(
        options: OzonApiRequestOptions,
        credentials?: OzonApiCredentials,
    ): Record<string, string> {
        const authMode = options.authMode ?? 'seller';
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (authMode === 'bearer') {
            if (!options.bearerToken) {
                throw new Error(
                    `Bearer token required for Ozon API path=${options.path}`,
                );
            }
            headers.Authorization = `Bearer ${options.bearerToken}`;
            return headers;
        }

        if (authMode === 'none') {
            return headers;
        }

        if (!credentials) {
            throw new Error(
                `Seller credentials required for Ozon API path=${options.path}`,
            );
        }

        headers['Client-Id'] = credentials.clientId;
        headers['Api-Key'] = credentials.apiKey;
        return headers;
    }

    protected sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
