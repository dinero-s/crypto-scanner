import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllowedOzonApiService } from '../compliance/allowed-ozon-api.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { OzonApiType } from '../constants/ozon.enums';
import { BaseOzonApiClient } from './base-ozon-api.client';
import { OzonApiRateLimiterService } from './ozon-api-rate-limiter.service';

export interface OzonPerformanceCredentials {
    bearerToken?: string;
    clientId?: string;
    clientSecret?: string;
}

export interface OzonPerformanceCampaign {
    id: number;
    title: string;
    state: string;
}

export interface OzonPerformanceCampaignsResponse {
    list: OzonPerformanceCampaign[];
}

export interface OzonPerformanceStatisticsRow {
    campaignId: number;
    views: number;
    clicks: number;
    ctr: number;
    expense: number;
    orders: number;
}

export interface OzonPerformanceStatisticsResponse {
    rows: OzonPerformanceStatisticsRow[];
}

interface OzonPerformanceTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

interface OzonPerformanceStatisticsRequestResponse {
    UUID?: string;
    uuid?: string;
}

const PERFORMANCE_CAMPAIGNS_BATCH_SIZE = 10;
const PERFORMANCE_REPORT_POLL_INTERVAL_MS = 2_000;
const PERFORMANCE_REPORT_MAX_ATTEMPTS = 30;
const PERFORMANCE_TOKEN_SKEW_SECONDS = 60;

/** Клиент официального Ozon Performance API (реклама) */
@Injectable()
export class PerformanceApiClient extends BaseOzonApiClient {
    private readonly tokenCache = new Map<
        string,
        { token: string; expiresAt: number }
    >();

    constructor(
        httpService: HttpService,
        configService: ConfigService,
        allowedOzonApiService: AllowedOzonApiService,
        complianceLog: ComplianceLogService,
        rateLimiter: OzonApiRateLimiterService,
    ) {
        super(
            httpService,
            configService,
            allowedOzonApiService,
            complianceLog,
            rateLimiter,
        );
    }

    private getBaseUrl(): string {
        return (
            this.configService.get<string>('ozon.api.performanceBaseUrl') ??
            'https://api-performance.ozon.ru'
        );
    }

    async listCampaigns(
        credentials: OzonPerformanceCredentials,
        userId?: string,
    ): Promise<OzonPerformanceCampaignsResponse> {
        const bearerToken = await this.resolveBearerToken(credentials, userId);

        return this.request<OzonPerformanceCampaignsResponse>(
            {
                apiType: OzonApiType.PERFORMANCE,
                baseUrl: this.getBaseUrl(),
                path: '/api/client/campaign',
                method: 'GET',
                authMode: 'bearer',
                bearerToken,
                userId,
            },
            undefined,
        );
    }

    async getStatistics(
        credentials: OzonPerformanceCredentials,
        dateFrom: string,
        dateTo: string,
        userId?: string,
    ): Promise<OzonPerformanceStatisticsResponse> {
        const bearerToken = await this.resolveBearerToken(credentials, userId);
        const campaigns = await this.listCampaigns(credentials, userId);
        const campaignIds = (campaigns.list ?? []).map((campaign) =>
            String(campaign.id),
        );

        if (campaignIds.length === 0) {
            return { rows: [] };
        }

        const rows: OzonPerformanceStatisticsRow[] = [];

        for (
            let offset = 0;
            offset < campaignIds.length;
            offset += PERFORMANCE_CAMPAIGNS_BATCH_SIZE
        ) {
            const batch = campaignIds.slice(
                offset,
                offset + PERFORMANCE_CAMPAIGNS_BATCH_SIZE,
            );
            const batchRows = await this.fetchStatisticsReport(
                bearerToken,
                batch,
                dateFrom,
                dateTo,
                userId,
            );
            rows.push(...batchRows);
        }

        return { rows };
    }

    private async resolveBearerToken(
        credentials: OzonPerformanceCredentials,
        userId?: string,
    ): Promise<string> {
        if (credentials.bearerToken) {
            return credentials.bearerToken;
        }

        if (!credentials.clientId || !credentials.clientSecret) {
            throw new Error('Performance API credentials are not configured');
        }

        const cached = this.tokenCache.get(credentials.clientId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.token;
        }

        const tokenResponse = await this.fetchAccessToken(
            credentials.clientId,
            credentials.clientSecret,
            userId,
        );

        this.tokenCache.set(credentials.clientId, {
            token: tokenResponse.access_token,
            expiresAt:
                Date.now() +
                Math.max(
                    0,
                    tokenResponse.expires_in - PERFORMANCE_TOKEN_SKEW_SECONDS,
                ) *
                    1000,
        });

        return tokenResponse.access_token;
    }

    private async fetchAccessToken(
        clientId: string,
        clientSecret: string,
        userId?: string,
    ): Promise<OzonPerformanceTokenResponse> {
        return this.request<OzonPerformanceTokenResponse>(
            {
                apiType: OzonApiType.PERFORMANCE,
                baseUrl: this.getBaseUrl(),
                path: '/api/client/token',
                method: 'POST',
                authMode: 'none',
                body: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials',
                },
                userId,
            },
            undefined,
        );
    }

    private async fetchStatisticsReport(
        bearerToken: string,
        campaignIds: string[],
        dateFrom: string,
        dateTo: string,
        userId?: string,
    ): Promise<OzonPerformanceStatisticsRow[]> {
        const requestResponse =
            await this.request<OzonPerformanceStatisticsRequestResponse>(
                {
                    apiType: OzonApiType.PERFORMANCE,
                    baseUrl: this.getBaseUrl(),
                    path: '/api/client/statistics',
                    method: 'POST',
                    authMode: 'bearer',
                    bearerToken,
                    body: {
                        campaigns: campaignIds,
                        dateFrom,
                        dateTo,
                        groupBy: 'DATE',
                    },
                    userId,
                },
                undefined,
            );

        const reportUuid = requestResponse.UUID ?? requestResponse.uuid;
        if (!reportUuid) {
            this.logger.warn('Performance statistics UUID missing');
            return [];
        }

        for (let attempt = 0; attempt < PERFORMANCE_REPORT_MAX_ATTEMPTS; attempt += 1) {
            const report = await this.request<Record<string, unknown>>(
                {
                    apiType: OzonApiType.PERFORMANCE,
                    baseUrl: this.getBaseUrl(),
                    path: `/api/client/statistics/report?UUID=${encodeURIComponent(reportUuid)}`,
                    method: 'GET',
                    authMode: 'bearer',
                    bearerToken,
                    userId,
                },
                undefined,
            );

            const rows = this.parseStatisticsRows(report);
            if (rows.length > 0) {
                return rows;
            }

            const state = this.extractReportState(report);
            if (state === 'ERROR') {
                this.logger.warn(
                    `Performance statistics report failed uuid=${reportUuid}`,
                );
                return [];
            }

            if (state === 'OK' || state === 'READY') {
                return rows;
            }

            await this.sleep(PERFORMANCE_REPORT_POLL_INTERVAL_MS);
        }

        this.logger.warn(
            `Performance statistics report timeout uuid=${reportUuid}`,
        );
        return [];
    }

    private extractReportState(report: Record<string, unknown>): string | undefined {
        const state = report.state ?? report.status;
        return typeof state === 'string' ? state.toUpperCase() : undefined;
    }

    private parseStatisticsRows(
        report: Record<string, unknown>,
    ): OzonPerformanceStatisticsRow[] {
        const rowsSource = report.rows ?? report.report ?? report.data;
        if (!Array.isArray(rowsSource)) {
            return [];
        }

        const parsedRows: OzonPerformanceStatisticsRow[] = [];

        for (const row of rowsSource) {
            if (!row || typeof row !== 'object') {
                continue;
            }

            const record = row as Record<string, unknown>;
            const campaignId = this.parseNumber(
                record.campaignId ?? record.campaign_id ?? record.id,
            );
            if (campaignId === undefined) {
                continue;
            }

            parsedRows.push({
                campaignId,
                views: this.parseNumber(record.views) ?? 0,
                clicks: this.parseNumber(record.clicks) ?? 0,
                ctr: this.parseNumber(record.ctr) ?? 0,
                expense:
                    this.parseNumber(record.expense ?? record.moneySpent) ?? 0,
                orders: this.parseNumber(record.orders) ?? 0,
            });
        }

        return parsedRows;
    }

    private parseNumber(value: unknown): number | undefined {
        if (typeof value === 'number' && !Number.isNaN(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = Number.parseFloat(value);
            return Number.isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
    }
}
