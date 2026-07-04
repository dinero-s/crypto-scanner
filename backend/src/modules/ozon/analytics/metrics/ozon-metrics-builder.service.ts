import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { AnyBulkWriteOperation } from 'mongodb';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    ProductAnalyticsSnapshotDoc,
    ProductAnalyticsSnapshotEntity,
} from '../entities/product-analytics-snapshot.entity';
import {
    OzonMetricSnapshotDoc,
    OzonMetricSnapshotEntity,
} from '../entities/ozon-metric-snapshot.entity';
import {
    SellerProductDoc,
    SellerProductEntity,
} from '../../seller/entities/seller-product.entity';
import { startOfDayUtc } from '../metrics/metric-utils';

interface AdMetricsAggregate {
    adSpend?: number;
    adOrders?: number;
    unitsSold?: number;
}

interface LegacyDayAggregate {
    adSpend: number;
    adOrders: number;
    unitsSold: number;
    stock?: number;
}

/** Построение дневных metric snapshots из данных синхронизации */
@Injectable()
export class OzonMetricsBuilderService {
    private readonly logger = new Logger(OzonMetricsBuilderService.name);

    constructor(
        @DatabaseModel(OzonMetricSnapshotEntity.name)
        private readonly metricSnapshotModel: Model<OzonMetricSnapshotDoc>,
        @DatabaseModel(SellerProductEntity.name)
        private readonly sellerProductModel: Model<SellerProductDoc>,
        @DatabaseModel(ProductAnalyticsSnapshotEntity.name)
        private readonly legacySnapshotModel: Model<ProductAnalyticsSnapshotDoc>,
        private readonly configService: ConfigService,
    ) {}

    async buildMetrics(userId: string, integrationId: string): Promise<number> {
        const batchSize =
            this.configService.get<number>('ozon.audit.metricsBatchSize') ?? 200;
        const filter = {
            userId: new Types.ObjectId(userId),
            connectionId: new Types.ObjectId(integrationId),
        };
        const total = await this.sellerProductModel.countDocuments(filter).exec();
        const today = startOfDayUtc(new Date());
        const backfillFrom = startOfDayUtc(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        );
        let built = 0;

        for (let skip = 0; skip < total; skip += batchSize) {
            const products = await this.sellerProductModel
                .find(filter)
                .skip(skip)
                .limit(batchSize)
                .exec();

            if (products.length === 0) {
                break;
            }

            const productIds = products.map((product) => product.productId);
            const todayMetrics = await this.aggregateAdMetricsBatch(
                userId,
                productIds,
                today,
            );
            const legacyByProduct = await this.aggregateLegacySnapshotsBatch(
                userId,
                productIds,
                backfillFrom,
            );

            const bulkOps: AnyBulkWriteOperation<OzonMetricSnapshotDoc>[] = [];

            for (const product of products) {
                const adMetrics = todayMetrics.get(product.productId) ?? {};
                bulkOps.push(
                    this.buildTodayMetricOp(product, today, adMetrics),
                );

                const legacyDays = legacyByProduct.get(product.productId);
                if (legacyDays) {
                    for (const [dayKey, dayMetrics] of legacyDays) {
                        bulkOps.push(
                            this.buildBackfillMetricOp(
                                product,
                                integrationId,
                                new Date(dayKey),
                                dayMetrics,
                            ),
                        );
                    }
                }
            }

            if (bulkOps.length > 0) {
                await this.metricSnapshotModel.bulkWrite(bulkOps, {
                    ordered: false,
                });
            }

            built += products.length;
        }

        this.logger.log(
            `metrics built userId=${userId} integrationId=${integrationId} products=${String(built)}`,
        );

        return built;
    }

    private buildTodayMetricOp(
        product: SellerProductDoc,
        date: Date,
        adMetrics: AdMetricsAggregate,
    ): AnyBulkWriteOperation<OzonMetricSnapshotDoc> {
        const price = product.price;
        const oldPrice = product.oldPrice;
        const discountPercent =
            price !== undefined && oldPrice !== undefined && oldPrice > 0
                ? (oldPrice - price) / oldPrice
                : undefined;

        const unitsSold = adMetrics.unitsSold;
        const stockAvailable = product.stockPresent ?? 0;
        const revenue =
            price !== undefined && unitsSold !== undefined
                ? price * unitsSold
                : undefined;
        const adSpend = adMetrics.adSpend;
        const adOrders = adMetrics.adOrders;
        const drr =
            revenue !== undefined && revenue > 0 && adSpend !== undefined
                ? adSpend / revenue
                : undefined;
        const acos =
            revenue !== undefined && revenue > 0 && adSpend !== undefined
                ? adSpend / revenue
                : undefined;
        const avgDailySales = unitsSold ?? 0;
        const stockDaysLeft =
            avgDailySales > 0 ? stockAvailable / avgDailySales : undefined;
        const grossProfitEstimate =
            price !== undefined && unitsSold !== undefined
                ? price * unitsSold * 0.3
                : undefined;

        return {
            updateOne: {
                filter: {
                    integrationId: product.connectionId,
                    productId: product.productId,
                    date,
                },
                update: {
                    userId: product.userId,
                    integrationId: product.connectionId,
                    productId: product.productId,
                    offerId: product.offerId,
                    sku: product.sku,
                    date,
                    price,
                    oldPrice,
                    discountPercent,
                    stockAvailable,
                    stockDaysLeft,
                    unitsSold,
                    revenue,
                    adSpend,
                    adOrders,
                    drr,
                    acos,
                    grossProfitEstimate,
                    marginPercent: 30,
                },
                upsert: true,
            },
        };
    }

    private buildBackfillMetricOp(
        product: SellerProductDoc,
        integrationId: string,
        date: Date,
        dayMetrics: LegacyDayAggregate,
    ): AnyBulkWriteOperation<OzonMetricSnapshotDoc> {
        const price = product.price;
        const revenue =
            price !== undefined && dayMetrics.unitsSold > 0
                ? price * dayMetrics.unitsSold
                : undefined;
        const stockAvailable = dayMetrics.stock ?? product.stockPresent ?? 0;
        const stockDaysLeft =
            dayMetrics.unitsSold > 0
                ? stockAvailable / dayMetrics.unitsSold
                : undefined;

        return {
            updateOne: {
                filter: {
                    integrationId: new Types.ObjectId(integrationId),
                    productId: product.productId,
                    date,
                },
                update: {
                    $setOnInsert: {
                        userId: product.userId,
                        integrationId: new Types.ObjectId(integrationId),
                        productId: product.productId,
                        offerId: product.offerId,
                        sku: product.sku,
                    },
                    $set: {
                        adSpend:
                            dayMetrics.adSpend > 0 ? dayMetrics.adSpend : undefined,
                        adOrders:
                            dayMetrics.adOrders > 0 ? dayMetrics.adOrders : undefined,
                        unitsSold:
                            dayMetrics.unitsSold > 0
                                ? dayMetrics.unitsSold
                                : undefined,
                        stockAvailable,
                        stockDaysLeft,
                        price,
                        revenue,
                    },
                },
                upsert: true,
            },
        };
    }

    private async aggregateAdMetricsBatch(
        userId: string,
        productIds: string[],
        date: Date,
    ): Promise<Map<string, AdMetricsAggregate>> {
        if (productIds.length === 0) {
            return new Map();
        }

        const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        const grouped = await this.legacySnapshotModel
            .aggregate<{
                _id: string;
                adSpend: number;
                adOrders: number;
                unitsSold: number;
            }>([
                {
                    $match: {
                        userId: new Types.ObjectId(userId),
                        productId: { $in: productIds },
                        collectedAt: { $gte: date, $lt: dayEnd },
                    },
                },
                {
                    $group: {
                        _id: '$productId',
                        adSpend: { $sum: { $ifNull: ['$adSpend', 0] } },
                        adOrders: { $sum: { $ifNull: ['$adOrders', 0] } },
                        unitsSold: { $sum: { $ifNull: ['$salesUnits', 0] } },
                    },
                },
            ])
            .exec();

        const result = new Map<string, AdMetricsAggregate>();
        for (const row of grouped) {
            result.set(row._id, {
                adSpend: row.adSpend > 0 ? row.adSpend : undefined,
                adOrders: row.adOrders > 0 ? row.adOrders : undefined,
                unitsSold: row.unitsSold > 0 ? row.unitsSold : undefined,
            });
        }

        const missingIds = productIds.filter((id) => !result.has(id));
        if (missingIds.length > 0) {
            const latestRows = await this.legacySnapshotModel
                .aggregate<{
                    _id: string;
                    adSpend?: number;
                    adOrders?: number;
                    unitsSold?: number;
                }>([
                    {
                        $match: {
                            userId: new Types.ObjectId(userId),
                            productId: { $in: missingIds },
                        },
                    },
                    { $sort: { collectedAt: -1 } },
                    {
                        $group: {
                            _id: '$productId',
                            adSpend: { $first: '$adSpend' },
                            adOrders: { $first: '$adOrders' },
                            unitsSold: { $first: '$salesUnits' },
                        },
                    },
                ])
                .exec();

            for (const row of latestRows) {
                result.set(row._id, {
                    adSpend: row.adSpend,
                    adOrders: row.adOrders,
                    unitsSold: row.unitsSold,
                });
            }
        }

        return result;
    }

    private async aggregateLegacySnapshotsBatch(
        userId: string,
        productIds: string[],
        from: Date,
    ): Promise<Map<string, Map<string, LegacyDayAggregate>>> {
        if (productIds.length === 0) {
            return new Map();
        }

        const rows = await this.legacySnapshotModel
            .aggregate<{
                productId: string;
                day: Date;
                adSpend: number;
                adOrders: number;
                unitsSold: number;
                stock?: number;
            }>([
                {
                    $match: {
                        userId: new Types.ObjectId(userId),
                        productId: { $in: productIds },
                        collectedAt: { $gte: from },
                    },
                },
                {
                    $addFields: {
                        day: {
                            $dateFromParts: {
                                year: { $year: '$collectedAt' },
                                month: { $month: '$collectedAt' },
                                day: { $dayOfMonth: '$collectedAt' },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: { productId: '$productId', day: '$day' },
                        adSpend: { $sum: { $ifNull: ['$adSpend', 0] } },
                        adOrders: { $sum: { $ifNull: ['$adOrders', 0] } },
                        unitsSold: { $sum: { $ifNull: ['$salesUnits', 0] } },
                        stock: { $max: '$stock' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        productId: '$_id.productId',
                        day: '$_id.day',
                        adSpend: 1,
                        adOrders: 1,
                        unitsSold: 1,
                        stock: 1,
                    },
                },
            ])
            .exec();

        const result = new Map<string, Map<string, LegacyDayAggregate>>();
        for (const row of rows) {
            const dayKey = startOfDayUtc(row.day).toISOString();
            const byDay = result.get(row.productId) ?? new Map();
            byDay.set(dayKey, {
                adSpend: row.adSpend,
                adOrders: row.adOrders,
                unitsSold: row.unitsSold,
                stock: row.stock,
            });
            result.set(row.productId, byDay);
        }

        return result;
    }
}
