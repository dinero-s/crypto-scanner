import { Injectable } from '@nestjs/common';
import { Types, PipelineStage } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonAuditRecommendationStatus,
} from '../../constants/ozon.enums';
import { AlertEventDoc, AlertEventEntity, AlertEventTableName } from '../../alerts/entities/alert-event.entity';
import {
    OzonAuditRecommendationTableName,
} from '../entities/ozon-audit-recommendation.entity';
import {
    ProductAnalyticsSnapshotDoc,
    ProductAnalyticsSnapshotEntity,
} from '../entities/product-analytics-snapshot.entity';
import {
    SellerProductDoc,
    SellerProductEntity,
} from '../../seller/entities/seller-product.entity';
import { ListProductsQueryDto } from '../../dto/ozon-query.dto';

export interface ProductListItemView {
    productId: string;
    offerId?: string;
    sku?: string;
    title?: string;
    price?: number;
    stockPresent?: number;
    stockReserved?: number;
    lastSyncedAt?: Date;
    updatedAt?: Date;
    connectionId?: Types.ObjectId;
    recommendationsCount: number;
    alertsCount: number;
}

export interface PaginatedProductsResult {
    items: ProductListItemView[];
    total: number;
    page: number;
    limit: number;
}

/** Чтение аналитики и списка товаров продавца */
@Injectable()
export class ProductAnalyticsService {
    constructor(
        @DatabaseModel(SellerProductEntity.name)
        private readonly sellerProductModel: Model<SellerProductDoc>,
        @DatabaseModel(ProductAnalyticsSnapshotEntity.name)
        private readonly snapshotModel: Model<ProductAnalyticsSnapshotDoc>,
        @DatabaseModel(AlertEventEntity.name)
        private readonly alertModel: Model<AlertEventDoc>,
    ) {}

    async getProductAnalytics(
        userId: string,
        productId: string,
    ): Promise<{
        product: SellerProductDoc | null;
        snapshots: ProductAnalyticsSnapshotDoc[];
        alerts: AlertEventDoc[];
    }> {
        const userObjectId = new Types.ObjectId(userId);

        const product = await this.sellerProductModel.findOne({
            userId: userObjectId,
            productId,
        });

        const snapshots = await this.snapshotModel
            .find({
                userId: userObjectId,
                productId,
            })
            .sort({ collectedAt: -1 })
            .limit(30)
            .exec();

        const alerts = await this.alertModel
            .find({
                userId: userObjectId,
                productId,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .exec();

        return { product, snapshots, alerts };
    }

    async listProducts(
        userId: string,
        filters: ListProductsQueryDto,
    ): Promise<PaginatedProductsResult> {
        const userObjectId = new Types.ObjectId(userId);
        const matchQuery: Record<string, unknown> = {
            userId: userObjectId,
        };

        if (filters.connectionId) {
            matchQuery.connectionId = new Types.ObjectId(filters.connectionId);
        }

        if (filters.noStock === true) {
            matchQuery.stockPresent = 0;
        }

        if (filters.search?.trim()) {
            const searchRegex = new RegExp(filters.search.trim(), 'i');
            matchQuery.$or = [
                { title: searchRegex },
                { offerId: searchRegex },
                { productId: searchRegex },
            ];
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 50;
        const skip = (page - 1) * limit;
        const sortBy = filters.sortBy ?? 'updatedAt';
        const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
        const sortField =
            sortBy === 'price' ? 'price' : sortBy === 'stock' ? 'stockPresent' : 'updatedAt';

        const activeRecommendationStatuses = [
            OzonAuditRecommendationStatus.NEW,
            OzonAuditRecommendationStatus.VIEWED,
        ];

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: OzonAuditRecommendationTableName,
                    let: { productId: '$productId', userId: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $eq: ['$productId', '$$productId'] },
                                        { $in: ['$status', activeRecommendationStatuses] },
                                    ],
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: 'recommendationStats',
                },
            },
            {
                $lookup: {
                    from: AlertEventTableName,
                    let: { productId: '$productId', userId: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $eq: ['$productId', '$$productId'] },
                                    ],
                                },
                            },
                        },
                        { $count: 'count' },
                    ],
                    as: 'alertStats',
                },
            },
            {
                $addFields: {
                    recommendationsCount: {
                        $ifNull: [
                            { $arrayElemAt: ['$recommendationStats.count', 0] },
                            0,
                        ],
                    },
                    alertsCount: {
                        $ifNull: [{ $arrayElemAt: ['$alertStats.count', 0] }, 0],
                    },
                },
            },
        ];

        if (filters.hasRecommendations === true) {
            pipeline.push({ $match: { recommendationsCount: { $gt: 0 } } });
        }

        if (filters.hasAlerts === true) {
            pipeline.push({ $match: { alertsCount: { $gt: 0 } } });
        }

        pipeline.push({
            $facet: {
                items: [
                    { $sort: { [sortField]: sortOrder } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            productId: 1,
                            offerId: 1,
                            sku: 1,
                            title: 1,
                            price: 1,
                            stockPresent: 1,
                            stockReserved: 1,
                            lastSyncedAt: 1,
                            updatedAt: 1,
                            connectionId: 1,
                            recommendationsCount: 1,
                            alertsCount: 1,
                        },
                    },
                ],
                total: [{ $count: 'count' }],
            },
        });

        const aggregated = await this.sellerProductModel
            .aggregate<{
                items: ProductListItemView[];
                total: Array<{ count: number }>;
            }>(pipeline)
            .exec();

        const result = aggregated[0] ?? { items: [], total: [] };

        return {
            items: result.items,
            total: result.total[0]?.count ?? 0,
            page,
            limit,
        };
    }
}
