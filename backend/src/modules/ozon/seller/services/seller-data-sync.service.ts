import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { SellerApiClient } from '../../clients/seller-api.client';
import { PerformanceApiClient } from '../../clients/performance-api.client';
import { OzonConnectionStatus, OzonMetricsSourceApi } from '../../constants/ozon.enums';
import { OzonConnectionDoc } from '../../integration/entities/ozon-connection.entity';
import { OzonConnectionService } from '../../integration/services/ozon-connection.service';
import {
    ProductAnalyticsSnapshotDoc,
    ProductAnalyticsSnapshotEntity,
} from '../../analytics/entities/product-analytics-snapshot.entity';
import {
    OzonMetricSnapshotDoc,
    OzonMetricSnapshotEntity,
} from '../../analytics/entities/ozon-metric-snapshot.entity';
import {
    OzonSellerReportDoc,
    OzonSellerReportEntity,
} from '../entities/ozon-seller-report.entity';
import {
    SellerProductDoc,
    SellerProductEntity,
} from '../entities/seller-product.entity';
import { OZON_SYNC_PRODUCTS_BATCH_SIZE } from 'src/common/queue/constants/queue.constant';
import { startOfDayUtc } from '../../analytics/metrics/metric-utils';

/** Синхронизация данных собственного магазина через Seller API */
@Injectable()
export class SellerDataSyncService {
    private readonly logger = new Logger(SellerDataSyncService.name);

    constructor(
        @DatabaseModel(SellerProductEntity.name)
        private readonly sellerProductModel: Model<SellerProductDoc>,
        @DatabaseModel(ProductAnalyticsSnapshotEntity.name)
        private readonly snapshotModel: Model<ProductAnalyticsSnapshotDoc>,
        @DatabaseModel(OzonMetricSnapshotEntity.name)
        private readonly metricSnapshotModel: Model<OzonMetricSnapshotDoc>,
        @DatabaseModel(OzonSellerReportEntity.name)
        private readonly reportModel: Model<OzonSellerReportDoc>,
        private readonly connectionService: OzonConnectionService,
        private readonly sellerApiClient: SellerApiClient,
        private readonly performanceApiClient: PerformanceApiClient,
    ) {}

    async syncAll(connectionId: string, userId: string): Promise<void> {
        const connection = await this.connectionService.findByIdForUser(
            userId,
            connectionId,
        );

        if (connection.status !== OzonConnectionStatus.ACTIVE) {
            this.logger.warn(
                `sync skipped connectionId=${connectionId} status=${connection.status}`,
            );
            return;
        }

        const apiKey = this.connectionService.getDecryptedApiKey(connection);
        const credentials = { clientId: connection.clientId, apiKey };

        await this.syncProducts(connection, credentials, userId);
        await this.syncPricesAndStocks(connection, credentials, userId);
        await this.syncOrders(connection, credentials, userId);
        await this.syncAdMetrics(connection, credentials, userId);
        await this.syncFinanceReports(connection, credentials, userId);

        await this.connectionService.markSyncCompleted(connectionId);
        this.logger.log(`sync completed connectionId=${connectionId}`);
    }

    async syncProducts(
        connection: OzonConnectionDoc,
        credentials: { clientId: string; apiKey: string },
        userId: string,
    ): Promise<void> {
        let lastId = '';
        let hasMore = true;

        while (hasMore) {
            const response = await this.sellerApiClient.listProducts(
                credentials,
                lastId,
                100,
                userId,
            );

            const items = response.result?.items ?? [];
            if (items.length === 0) {
                hasMore = false;
                break;
            }

            const productIds = items.map((item) => String(item.product_id));
            const info = await this.sellerApiClient.getProductInfo(
                credentials,
                productIds,
                [],
                [],
                userId,
            );

            const bulkOps = (info.items ?? []).map((item) => ({
                updateOne: {
                    filter: {
                        connectionId: connection._id,
                        productId: String(item.id),
                    },
                    update: {
                        $set: {
                            userId: connection.userId,
                            connectionId: connection._id,
                            productId: String(item.id),
                            offerId: item.offer_id,
                            sku: String(item.sku),
                            title: item.name,
                            price: this.parsePrice(item.price),
                            oldPrice: this.parsePrice(item.old_price),
                            marketingPrice: this.parsePrice(item.marketing_price),
                            stockPresent: item.stocks?.present ?? 0,
                            stockReserved: item.stocks?.reserved ?? 0,
                            lastSyncedAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            }));

            if (bulkOps.length > 0) {
                await this.sellerProductModel.bulkWrite(bulkOps, { ordered: false });
            }

            lastId = response.result?.last_id ?? '';
            hasMore = Boolean(lastId) && items.length >= 100;
        }
    }

    async syncPricesAndStocks(
        connection: OzonConnectionDoc,
        credentials: { clientId: string; apiKey: string },
        userId: string,
    ): Promise<void> {
        const batchSize = OZON_SYNC_PRODUCTS_BATCH_SIZE;
        let lastObjectId: Types.ObjectId | undefined;

        while (true) {
            const filter: Record<string, unknown> = {
                connectionId: connection._id,
            };
            if (lastObjectId) {
                filter._id = { $gt: lastObjectId };
            }

            const products = await this.sellerProductModel
                .find(filter)
                .select({ productId: 1 })
                .sort({ _id: 1 })
                .limit(batchSize)
                .exec();

            if (products.length === 0) {
                break;
            }

            const productIds = products.map((product) => product.productId);
            const stocks = await this.sellerApiClient.getStocks(
                credentials,
                productIds,
                userId,
            );

            const snapshotDay = startOfDayUtc(new Date());
            const collectedAt = new Date();
            const productBulkOps: Array<{
                updateOne: {
                    filter: Record<string, unknown>;
                    update: Record<string, unknown>;
                };
            }> = [];
            const snapshotBulkOps: Array<{
                updateOne: {
                    filter: Record<string, unknown>;
                    update: Record<string, unknown>;
                    upsert: boolean;
                };
            }> = [];

            for (const item of stocks.items ?? []) {
                const present =
                    item.stocks?.reduce(
                        (sum, stock) => sum + (stock.present ?? 0),
                        0,
                    ) ?? 0;
                const reserved =
                    item.stocks?.reduce(
                        (sum, stock) => sum + (stock.reserved ?? 0),
                        0,
                    ) ?? 0;
                const productId = String(item.product_id);

                productBulkOps.push({
                    updateOne: {
                        filter: {
                            connectionId: connection._id,
                            productId,
                        },
                        update: {
                            $set: {
                                stockPresent: present,
                                stockReserved: reserved,
                                lastSyncedAt: collectedAt,
                            },
                        },
                    },
                });

                snapshotBulkOps.push({
                    updateOne: {
                        filter: {
                            userId: connection.userId,
                            productId,
                            snapshotDay,
                            sourceApi: OzonMetricsSourceApi.SELLER_API,
                        },
                        update: {
                            $set: {
                                stock: present,
                                collectedAt,
                            },
                            $setOnInsert: {
                                userId: connection.userId,
                                productId,
                                snapshotDay,
                                sourceApi: OzonMetricsSourceApi.SELLER_API,
                            },
                        },
                        upsert: true,
                    },
                });
            }

            if (productBulkOps.length > 0) {
                await this.sellerProductModel.bulkWrite(productBulkOps, {
                    ordered: false,
                });
            }

            if (snapshotBulkOps.length > 0) {
                await this.snapshotModel.bulkWrite(snapshotBulkOps, {
                    ordered: false,
                });
            }

            lastObjectId = products[products.length - 1]._id as Types.ObjectId;
            if (products.length < batchSize) {
                break;
            }
        }
    }

    async syncOrders(
        connection: OzonConnectionDoc,
        credentials: { clientId: string; apiKey: string },
        userId: string,
    ): Promise<void> {
        const to = new Date().toISOString();
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const snapshotDay = startOfDayUtc(new Date());
        const sellerProducts = await this.sellerProductModel
            .find({ connectionId: connection._id })
            .select({ productId: 1, offerId: 1, sku: 1 })
            .exec();
        const offerToProductId = new Map<string, string>();
        const skuToProductId = new Map<string, string>();

        for (const product of sellerProducts) {
            if (product.offerId) {
                offerToProductId.set(product.offerId, product.productId);
            }
            if (product.sku) {
                skuToProductId.set(product.sku, product.productId);
            }
        }

        const unitsByProduct = new Map<string, number>();
        let offset = 0;
        let hasNext = true;

        while (hasNext) {
            const response = await this.sellerApiClient.listOrders(
                credentials,
                since,
                to,
                offset,
                userId,
            );

            const parsed = this.parseOrdersResponse(response);
            for (const posting of parsed.postings) {
                for (const product of posting.products ?? []) {
                    const productId = this.resolveOrderProductId(
                        product,
                        offerToProductId,
                        skuToProductId,
                    );
                    if (!productId) {
                        continue;
                    }
                    const quantity = product.quantity ?? 1;
                    unitsByProduct.set(
                        productId,
                        (unitsByProduct.get(productId) ?? 0) + quantity,
                    );
                }
            }

            hasNext = parsed.hasNext;
            offset += parsed.postings.length;

            if (parsed.postings.length === 0) {
                break;
            }
        }

        if (unitsByProduct.size === 0) {
            return;
        }

        const bulkOps = [...unitsByProduct.entries()].map(([productId, unitsSold]) => ({
            updateOne: {
                filter: {
                    userId: connection.userId,
                    integrationId: connection._id,
                    productId,
                    date: snapshotDay,
                },
                update: {
                    $set: {
                        unitsSold,
                        ordersCount: unitsSold,
                    },
                    $setOnInsert: {
                        userId: connection.userId,
                        integrationId: connection._id,
                        productId,
                        date: snapshotDay,
                    },
                },
                upsert: true,
            },
        }));

        await this.metricSnapshotModel.bulkWrite(bulkOps, { ordered: false });

        this.logger.log(
            `orders synced connectionId=${String(connection._id)} products=${String(unitsByProduct.size)}`,
        );
    }

    async syncAdMetrics(
        connection: OzonConnectionDoc,
        _credentials: { clientId: string; apiKey: string },
        userId: string,
    ): Promise<void> {
        const performanceCredentials =
            this.connectionService.getPerformanceCredentials(connection);

        if (!performanceCredentials) {
            return;
        }

        const dateTo = new Date().toISOString().slice(0, 10);
        const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);

        try {
            const stats = await this.performanceApiClient.getStatistics(
                performanceCredentials,
                dateFrom,
                dateTo,
                userId,
            );

            const snapshotDay = startOfDayUtc(new Date());
            const collectedAt = new Date();
            const bulkOps = (stats.rows ?? []).map((row) => ({
                updateOne: {
                    filter: {
                        userId: connection.userId,
                        productId: String(row.campaignId),
                        snapshotDay,
                        sourceApi: OzonMetricsSourceApi.PERFORMANCE_API,
                    },
                    update: {
                        $set: {
                            adSpend: row.expense,
                            adClicks: row.clicks,
                            adOrders: row.orders,
                            collectedAt,
                        },
                        $setOnInsert: {
                            userId: connection.userId,
                            productId: String(row.campaignId),
                            snapshotDay,
                            sourceApi: OzonMetricsSourceApi.PERFORMANCE_API,
                        },
                    },
                    upsert: true,
                },
            }));

            if (bulkOps.length > 0) {
                await this.snapshotModel.bulkWrite(bulkOps, { ordered: false });
            }
        } catch {
            this.logger.warn(
                `Performance API sync skipped connectionId=${String(connection._id)}`,
            );
        }
    }

    async syncFinanceReports(
        connection: OzonConnectionDoc,
        credentials: { clientId: string; apiKey: string },
        userId: string,
    ): Promise<void> {
        try {
            const created = await this.sellerApiClient.createProductsReport(
                credentials,
                userId,
            );
            const reportCode = created.result?.code;
            if (!reportCode) {
                return;
            }

            const info = await this.sellerApiClient.getReportInfo(
                credentials,
                reportCode,
                userId,
            );

            const result = info.result;
            const status =
                result && typeof result === 'object' && 'status' in result
                    ? String((result as { status: string }).status)
                    : 'unknown';
            const file =
                result && typeof result === 'object' && 'file' in result
                    ? String((result as { file: string }).file)
                    : undefined;

            await this.reportModel.create({
                userId: connection.userId,
                connectionId: connection._id,
                reportCode,
                reportType: 'products',
                status,
                fileUrl: file,
                collectedAt: new Date(),
            });
        } catch {
            this.logger.warn(
                `Finance/products report sync skipped connectionId=${String(connection._id)}`,
            );
        }
    }

    private parseOrdersResponse(response: Record<string, unknown>): {
        postings: Array<{ products?: Array<{ sku?: number; offer_id?: string; quantity?: number }> }>;
        hasNext: boolean;
    } {
        const result = response.result;
        if (!result || typeof result !== 'object') {
            return { postings: [], hasNext: false };
        }

        const resultRecord = result as Record<string, unknown>;
        const postings = Array.isArray(resultRecord.postings)
            ? (resultRecord.postings as Array<{
                  products?: Array<{ sku?: number; offer_id?: string; quantity?: number }>;
              }>)
            : [];
        const hasNext = resultRecord.has_next === true;

        return { postings, hasNext };
    }

    private resolveOrderProductId(
        product: {
            sku?: number;
            offer_id?: string;
            quantity?: number;
        },
        offerToProductId: Map<string, string>,
        skuToProductId: Map<string, string>,
    ): string | undefined {
        if (product.offer_id) {
            const byOffer = offerToProductId.get(product.offer_id);
            if (byOffer) {
                return byOffer;
            }
        }
        if (product.sku !== undefined) {
            const bySku = skuToProductId.get(String(product.sku));
            if (bySku) {
                return bySku;
            }
            return String(product.sku);
        }
        return undefined;
    }

    private parsePrice(value: string | undefined): number | undefined {
        if (!value) {
            return undefined;
        }
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
}
