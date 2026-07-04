import { Injectable, Logger } from '@nestjs/common';
import { StatisticsApiClient } from '../../clients/statistics-api.client';
import {
    CompetitorProductDataResult,
    OzonCompetitorDataProvider,
} from '../interfaces/competitor-data-provider.interface';

const OFFICIAL_UNAVAILABLE_MESSAGE =
    'Данные по этой карточке недоступны через разрешенные API-методы.';

/** Официальный провайдер данных конкурента через Statistics/Seller API */
@Injectable()
export class OfficialOzonCompetitorDataProvider implements OzonCompetitorDataProvider {
    private readonly logger = new Logger(OfficialOzonCompetitorDataProvider.name);

    constructor(private readonly statisticsApiClient: StatisticsApiClient) {}

    async getProductDataByUrl(
        credentials: { clientId: string; apiKey: string },
        _url: string,
        productId: string | undefined,
        sku: string | undefined,
        userId?: string,
    ): Promise<CompetitorProductDataResult> {
        if (!productId && !sku) {
            return {
                success: false,
                reason: 'INVALID_URL',
                message: 'Не удалось определить идентификатор товара из URL',
            };
        }

        try {
            const metrics = await this.statisticsApiClient.getProductMetrics(
                credentials,
                productId,
                sku,
                userId,
            );

            const rawAvailableFields: string[] = [];
            if (metrics.price !== undefined) rawAvailableFields.push('price');
            if (metrics.stock !== undefined) rawAvailableFields.push('stock');
            if (metrics.rating !== undefined) rawAvailableFields.push('rating');
            if (metrics.reviewsCount !== undefined) rawAvailableFields.push('reviewsCount');

            if (!metrics.available || rawAvailableFields.length === 0) {
                return {
                    success: false,
                    reason: 'OFFICIAL_DATA_NOT_AVAILABLE',
                    message: OFFICIAL_UNAVAILABLE_MESSAGE,
                    data: {
                        rawAvailableFields,
                        availability: 'NOT_AVAILABLE_VIA_OFFICIAL_API',
                    },
                };
            }

            return {
                success: true,
                data: {
                    price: metrics.price,
                    rating: metrics.rating,
                    reviewsCount: metrics.reviewsCount,
                    availability:
                        metrics.stock !== undefined && metrics.stock > 0
                            ? 'IN_STOCK'
                            : metrics.stock === 0
                              ? 'OUT_OF_STOCK'
                              : undefined,
                    rawAvailableFields,
                },
            };
        } catch {
            this.logger.warn(
                `competitor official data failed productId=${productId ?? 'n/a'} sku=${sku ?? 'n/a'}`,
            );
            return {
                success: false,
                reason: 'API_ERROR',
                message: OFFICIAL_UNAVAILABLE_MESSAGE,
            };
        }
    }
}
