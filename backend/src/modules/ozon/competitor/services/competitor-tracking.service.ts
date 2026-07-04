import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    CompetitorProductStatus,
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
    OzonMetricsSourceApi,
} from '../../constants/ozon.enums';
import { AlertsService } from '../../alerts/services/alerts.service';
import { OzonConnectionAuditService } from '../../integration/services/ozon-connection-audit.service';
import { OzonConnectionService } from '../../integration/services/ozon-connection.service';
import { OzonQueueProducerService } from '../../queue/ozon-queue.producer.service';
import { CreateCompetitorProductDto } from '../dto/create-competitor-product.dto';
import {
    CompetitorAnalyticsSnapshotDoc,
    CompetitorAnalyticsSnapshotEntity,
} from '../entities/competitor-analytics-snapshot.entity';
import {
    CompetitorProductDoc,
    CompetitorProductEntity,
} from '../entities/competitor-product.entity';
import { OfficialOzonCompetitorDataProvider } from '../providers/official-ozon-competitor-data.provider';
import {
    isValidOzonProductUrl,
    normalizeOzonProductUrl,
    resolveCompetitorIdentifiers,
} from '../utils/ozon-url.parser';
import { toCompetitorView, CompetitorProductView } from '../mappers/competitor-view.mapper';

/** Мониторинг конкурентов через официальный API (legal-by-design) */
@Injectable()
export class CompetitorTrackingService {
    private readonly logger = new Logger(CompetitorTrackingService.name);

    constructor(
        @DatabaseModel(CompetitorProductEntity.name)
        private readonly competitorModel: Model<CompetitorProductDoc>,
        @DatabaseModel(CompetitorAnalyticsSnapshotEntity.name)
        private readonly snapshotModel: Model<CompetitorAnalyticsSnapshotDoc>,
        private readonly connectionService: OzonConnectionService,
        private readonly dataProvider: OfficialOzonCompetitorDataProvider,
        private readonly alertsService: AlertsService,
        private readonly connectionAuditService: OzonConnectionAuditService,
        private readonly queueProducer: OzonQueueProducerService,
    ) {}

    async addCompetitor(
        userId: string,
        dto: CreateCompetitorProductDto,
    ): Promise<CompetitorProductView> {
        const connectionId = await this.resolveConnectionId(userId, dto.connectionId);
        const inputUrl = dto.url ?? dto.productId ?? dto.sku;

        if (!inputUrl) {
            throw new BadRequestException('Укажите URL карточки Ozon');
        }

        if (dto.url && !isValidOzonProductUrl(dto.url)) {
            throw new BadRequestException('Некорректный URL карточки Ozon');
        }

        const identifiers = resolveCompetitorIdentifiers(dto);
        if (!identifiers.productId && !identifiers.sku) {
            throw new BadRequestException(
                'Не удалось извлечь идентификатор товара из URL',
            );
        }

        const normalizedUrl =
            identifiers.normalizedUrl ??
            (dto.url ? normalizeOzonProductUrl(dto.url) : undefined);

        if (normalizedUrl) {
            const duplicate = await this.competitorModel.findOne({
                userId: new Types.ObjectId(userId),
                url: normalizedUrl,
                status: { $ne: CompetitorProductStatus.PAUSED },
            });
            if (duplicate) {
                throw new ConflictException('Эта карточка уже добавлена в мониторинг');
            }
        }

        const competitor = await this.competitorModel.create({
            userId: new Types.ObjectId(userId),
            connectionId: new Types.ObjectId(connectionId),
            url: normalizedUrl,
            urlReference: identifiers.urlReference ?? normalizedUrl,
            source: 'ozon',
            marketplace: 'OZON',
            productId: identifiers.productId,
            externalProductId: identifiers.externalProductId ?? identifiers.productId,
            sku: identifiers.sku,
            offerId: identifiers.offerId,
            status: CompetitorProductStatus.ACTIVE,
        });

        await this.connectionAuditService.log({
            userId,
            connectionId,
            action: OzonConnectionAuditAction.COMPETITOR_ADDED,
            status: OzonConnectionAuditStatus.SUCCESS,
            summary: `Добавлен конкурент url=${normalizedUrl ?? identifiers.productId ?? ''}`,
        });

        await this.queueProducer.enqueueCompetitorSync(String(competitor._id), userId);

        return toCompetitorView(competitor);
    }

    async listCompetitors(userId: string): Promise<CompetitorProductView[]> {
        const docs = await this.competitorModel
            .find({
                userId: new Types.ObjectId(userId),
                status: { $ne: CompetitorProductStatus.PAUSED },
            })
            .sort({ createdAt: -1 })
            .exec();

        return docs.map((doc) => toCompetitorView(doc));
    }

    async getCompetitor(userId: string, competitorId: string): Promise<CompetitorProductView> {
        const competitor = await this.findCompetitorOrThrow(userId, competitorId);
        return toCompetitorView(competitor);
    }

    async removeCompetitor(userId: string, competitorId: string): Promise<void> {
        const competitor = await this.findCompetitorOrThrow(userId, competitorId);
        competitor.status = CompetitorProductStatus.PAUSED;
        await competitor.save();
    }

    async queueSyncAll(userId: string, connectionId?: string): Promise<{ queued: number }> {
        const queued = await this.fanOutCompetitorSyncJobs(userId, connectionId);

        await this.connectionAuditService.log({
            userId,
            connectionId,
            action: OzonConnectionAuditAction.COMPETITOR_SYNC_TRIGGERED,
            status: OzonConnectionAuditStatus.SUCCESS,
            summary: `queued=${String(queued)}`,
        });

        return { queued };
    }

    /** Постановка отдельных job на каждого активного конкурента */
    async fanOutCompetitorSyncJobs(
        userId: string,
        connectionId?: string,
    ): Promise<number> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
            status: CompetitorProductStatus.ACTIVE,
        };

        if (connectionId) {
            filter.connectionId = new Types.ObjectId(connectionId);
        }

        const competitors = await this.competitorModel
            .find(filter)
            .select({ _id: 1 })
            .exec();

        for (const competitor of competitors) {
            await this.queueProducer.enqueueCompetitorSync(
                String(competitor._id),
                userId,
            );
        }

        this.logger.log(
            `competitor sync fan-out userId=${userId} queued=${String(competitors.length)}`,
        );

        return competitors.length;
    }

    async listSnapshots(
        userId: string,
        competitorId: string,
        limit = 30,
    ): Promise<CompetitorAnalyticsSnapshotDoc[]> {
        await this.findCompetitorOrThrow(userId, competitorId);

        return this.snapshotModel
            .find({
                userId: new Types.ObjectId(userId),
                competitorProductId: new Types.ObjectId(competitorId),
            })
            .sort({ date: -1 })
            .limit(Math.min(limit, 100))
            .exec();
    }

    async syncCompetitor(competitorId: string, userId: string): Promise<void> {
        const competitor = await this.findCompetitorOrThrow(userId, competitorId);

        if (competitor.status === CompetitorProductStatus.PAUSED) {
            return;
        }

        const connection = await this.connectionService.findByIdForUser(
            userId,
            String(competitor.connectionId),
        );

        const apiKey = this.connectionService.getDecryptedApiKey(connection);
        const credentials = { clientId: connection.clientId, apiKey };
        const monitorUrl =
            competitor.url ??
            competitor.urlReference ??
            `https://www.ozon.ru/product/-${competitor.productId ?? ''}/`;

        const result = await this.dataProvider.getProductDataByUrl(
            credentials,
            monitorUrl,
            competitor.productId ?? competitor.externalProductId,
            competitor.sku,
            userId,
        );

        const previousSnapshot = await this.snapshotModel
            .findOne({ competitorProductId: competitor._id })
            .sort({ date: -1 })
            .exec();

        const now = new Date();
        const snapshotDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );

        if (!result.success) {
            competitor.status =
                result.reason === 'API_ERROR'
                    ? CompetitorProductStatus.ERROR
                    : CompetitorProductStatus.DATA_NOT_AVAILABLE;
            competitor.lastError = result.message;
            competitor.lastSyncedAt = now;
            await competitor.save();

            await this.upsertCompetitorSnapshot(competitor, snapshotDate, now, {
                availability: result.data?.availability ?? 'NOT_AVAILABLE_VIA_OFFICIAL_API',
                rawAvailableFields: result.data?.rawAvailableFields ?? [],
                unavailableFields: ['price', 'rating', 'reviewsCount', 'stock'],
            });

            this.logger.log(
                `competitor sync no official data competitorId=${competitorId} reason=${result.reason ?? 'unknown'}`,
            );
            return;
        }

        const data = result.data;
        const discountPercent =
            data?.price !== undefined &&
            data.oldPrice !== undefined &&
            data.oldPrice > 0
                ? (data.oldPrice - data.price) / data.oldPrice
                : undefined;

        competitor.status = CompetitorProductStatus.ACTIVE;
        competitor.lastError = undefined;
        competitor.lastSyncedAt = now;
        competitor.lastPrice = data?.price;
        competitor.lastOldPrice = data?.oldPrice;
        competitor.lastRating = data?.rating;
        competitor.lastReviewsCount = data?.reviewsCount;
        competitor.lastAvailability = data?.availability;
        if (data?.name) competitor.name = data.name;
        if (data?.sellerName) competitor.sellerName = data.sellerName;
        if (data?.brand) competitor.brand = data.brand;
        await competitor.save();

        await this.upsertCompetitorSnapshot(competitor, snapshotDate, now, {
            price: data?.price,
            oldPrice: data?.oldPrice,
            discountPercent,
            stock:
                data?.availability === 'IN_STOCK'
                    ? 1
                    : data?.availability === 'OUT_OF_STOCK'
                      ? 0
                      : undefined,
            rating: data?.rating,
            reviewsCount: data?.reviewsCount,
            availability: data?.availability,
            sellerName: data?.sellerName,
            rawAvailableFields: data?.rawAvailableFields ?? [],
            unavailableFields: this.buildUnavailableFields(data?.rawAvailableFields ?? []),
        });

        if (previousSnapshot && data?.price !== undefined) {
            await this.alertsService.handleCompetitorPriceChange(
                userId,
                String(competitor._id),
                previousSnapshot.price,
                data.price,
            );
        }

        this.logger.log(`competitor synced competitorId=${competitorId}`);
    }

    private async resolveConnectionId(
        userId: string,
        connectionId?: string,
    ): Promise<string> {
        if (connectionId) {
            await this.connectionService.findByIdForUser(userId, connectionId);
            return connectionId;
        }

        const connections = await this.connectionService.findAllByUser(userId);
        if (connections.length === 0) {
            throw new BadRequestException('Подключите Ozon API перед добавлением конкурента');
        }

        return connections[0].id;
    }

    private async findCompetitorOrThrow(
        userId: string,
        competitorId: string,
    ): Promise<CompetitorProductDoc> {
        const competitor = await this.competitorModel.findOne({
            _id: new Types.ObjectId(competitorId),
            userId: new Types.ObjectId(userId),
        });

        if (!competitor || competitor.status === CompetitorProductStatus.PAUSED) {
            throw new NotFoundException('Товар конкурента не найден');
        }

        return competitor;
    }

    private buildUnavailableFields(available: string[]): string[] {
        const all = ['price', 'stock', 'rating', 'reviewsCount'];
        return all.filter((field) => !available.includes(field));
    }

    private async upsertCompetitorSnapshot(
        competitor: CompetitorProductDoc,
        snapshotDate: Date,
        collectedAt: Date,
        fields: {
            price?: number;
            oldPrice?: number;
            discountPercent?: number;
            stock?: number;
            rating?: number;
            reviewsCount?: number;
            availability?: string;
            sellerName?: string;
            rawAvailableFields?: string[];
            unavailableFields?: string[];
        },
    ): Promise<void> {
        await this.snapshotModel.updateOne(
            {
                competitorProductId: competitor._id,
                date: snapshotDate,
            },
            {
                $set: {
                    ...fields,
                    collectedAt,
                    sourceApi: OzonMetricsSourceApi.STATISTICS_API,
                },
                $setOnInsert: {
                    userId: competitor.userId,
                    competitorProductId: competitor._id,
                    date: snapshotDate,
                },
            },
            { upsert: true },
        );
    }
}
