import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllowedOzonApiService } from '../compliance/allowed-ozon-api.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { OzonApiType } from '../constants/ozon.enums';
import {
    BaseOzonApiClient,
    OzonApiCredentials,
} from './base-ozon-api.client';
import { OzonApiRateLimiterService } from './ozon-api-rate-limiter.service';

export interface OzonStatisticsProductMetrics {
    productId?: string;
    sku?: string;
    price?: number;
    stock?: number;
    rating?: number;
    reviewsCount?: number;
    available: boolean;
    unavailableFields: string[];
}

/** Клиент официального Statistics/Analytics API Ozon */
@Injectable()
export class StatisticsApiClient extends BaseOzonApiClient {
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
            this.configService.get<string>('ozon.api.statisticsBaseUrl') ??
            'https://api-seller.ozon.ru'
        );
    }

    /** Получение рыночных метрик по SKU/product_id через официальный analytics API */
    async getProductMetrics(
        credentials: OzonApiCredentials,
        productId: string | undefined,
        sku: string | undefined,
        userId?: string,
    ): Promise<OzonStatisticsProductMetrics> {
        const unavailableFields: string[] = [];
        let price: number | undefined;
        let stock: number | undefined;
        let rating: number | undefined;
        let reviewsCount: number | undefined;
        let available = false;

        try {
            const response = await this.request<Record<string, unknown>>(
                {
                    apiType: OzonApiType.STATISTICS,
                    baseUrl: this.getBaseUrl(),
                    path: '/v1/analytics/data',
                    method: 'POST',
                    body: {
                        date_from: this.getDateDaysAgo(7),
                        date_to: this.getTodayDate(),
                        metrics: ['revenue', 'ordered_units'],
                        dimension: ['sku'],
                        filters: [],
                        limit: 1000,
                        offset: 0,
                    },
                    userId,
                },
                credentials,
            );

            const result = response.result;
            if (result && typeof result === 'object') {
                available = true;
                const parsed = this.extractMetricsFromAnalytics(
                    result as Record<string, unknown>,
                    sku,
                    productId,
                );
                price = parsed.price;
                stock = parsed.stock;
                rating = parsed.rating;
                reviewsCount = parsed.reviewsCount;
            }
        } catch {
            available = false;
        }

        if (!available) {
            this.allowedOzonApiService.logDataNotAvailable(
                'competitor_metrics',
                userId,
            );
            unavailableFields.push(
                'price',
                'stock',
                'rating',
                'reviewsCount',
            );
        } else {
            if (price === undefined) {
                unavailableFields.push('price');
            }
            if (stock === undefined) {
                unavailableFields.push('stock');
            }
            if (rating === undefined) {
                unavailableFields.push('rating');
            }
            if (reviewsCount === undefined) {
                unavailableFields.push('reviewsCount');
            }
        }

        return {
            productId,
            sku,
            price,
            stock,
            rating,
            reviewsCount,
            available,
            unavailableFields,
        };
    }

    private getTodayDate(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private getDateDaysAgo(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().slice(0, 10);
    }

    private extractMetricsFromAnalytics(
        result: Record<string, unknown>,
        sku: string | undefined,
        productId: string | undefined,
    ): Pick<
        OzonStatisticsProductMetrics,
        'price' | 'stock' | 'rating' | 'reviewsCount'
    > {
        const data = result.data;
        if (!Array.isArray(data)) {
            return {};
        }

        for (const row of data) {
            if (!row || typeof row !== 'object') {
                continue;
            }

            const dimensions = (row as { dimensions?: Array<{ id?: string }> })
                .dimensions;
            const metrics = (row as { metrics?: number[] }).metrics;
            const rowSku = dimensions?.[0]?.id;

            if (sku && rowSku !== sku) {
                continue;
            }

            if (productId && rowSku !== productId) {
                continue;
            }

            const orderedUnits = metrics?.[1];
            return {
                stock: typeof orderedUnits === 'number' ? orderedUnits : undefined,
            };
        }

        return {};
    }
}
