import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
    RecommendationEntity,
    RecommendationDoc,
} from 'src/modules/ozon/analytics/entities/recommendation.entity';
import { SellerProductEntity, SellerProductDoc } from 'src/modules/ozon/seller/entities/seller-product.entity';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import {
    AvailabilityStatus,
    MarketplaceType,
} from '../enums/admin-panel.enum';
import {
    AdminRecommendationDetailDto,
    AdminRecommendationListItemDto,
    FilterAdminRecommendationsDto,
} from '../dto/admin-recommendation.dto';
import { sanitizeRecord } from '../utils/sanitize.util';

/** Admin API для recommendations */
@Injectable()
export class AdminRecommendationsService {
    constructor(
        @DatabaseModel(RecommendationEntity.name)
        private readonly recommendationModel: Model<RecommendationDoc>,
        @DatabaseModel(SellerProductEntity.name)
        private readonly productModel: Model<SellerProductDoc>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        private readonly configService: ConfigService,
    ) {}

    async findAll(filter: FilterAdminRecommendationsDto): Promise<{
        data: AdminRecommendationListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const query = this.buildQuery(filter);

        const [rows, total] = await Promise.all([
            this.recommendationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.recommendationModel.countDocuments(query).exec(),
        ]);

        const data = await Promise.all(rows.map((row) => this.toListItem(row)));

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    }

    async findOne(id: string): Promise<AdminRecommendationDetailDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Recommendation не найдена');
        }
        const row = await this.recommendationModel.findById(id).lean().exec();
        if (!row) {
            throw new NotFoundException('Recommendation не найдена');
        }
        const listItem = await this.toListItem(row);
        const llmEnabled =
            this.configService.get<boolean>('ozon.ai.enabled') === true;

        return {
            ...listItem,
            fullText: row.recommendedAction,
            reason: row.reason,
            inputDataSummary: sanitizeRecord(row.evidence as Record<string, unknown>),
            ruleBasedResult: sanitizeRecord(row.evidence as Record<string, unknown>),
            llmResult: llmEnabled
                ? sanitizeRecord((row.evidence as Record<string, unknown>)?.llm as Record<string, unknown>)
                : undefined,
            userAction: row.status,
            resolvedAt: row.resolvedAt?.toISOString(),
        };
    }

    private buildQuery(filter: FilterAdminRecommendationsDto): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filter.userId) {
            query.userId = new Types.ObjectId(filter.userId);
        }
        if (filter.productId) {
            query.productId = filter.productId;
        }
        if (filter.type) {
            query.type = filter.type;
        }
        if (filter.severity) {
            query.severity = filter.severity;
        }
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.dateFrom || filter.dateTo) {
            const dateFilter: { $gte?: Date; $lte?: Date } = {};
            if (filter.dateFrom) {
                dateFilter.$gte = new Date(filter.dateFrom);
            }
            if (filter.dateTo) {
                dateFilter.$lte = new Date(filter.dateTo);
            }
            query.createdAt = dateFilter;
        }

        return query;
    }

    private async toListItem(
        row: Record<string, unknown>,
    ): Promise<AdminRecommendationListItemDto> {
        const userId = row.userId as Types.ObjectId;
        const user = await this.usersModel.findById(userId).select('email').lean().exec();

        let productName: string | undefined;
        if (row.productId) {
            const product = await this.productModel
                .findOne({ productId: row.productId, userId })
                .select('title')
                .lean()
                .exec();
            productName = product?.title;
        }

        const evidence = row.evidence as Record<string, unknown> | undefined;
        const availabilityStatus = this.resolveAvailability(evidence);

        return {
            id: String(row._id),
            createdAt: (row.createdAt as Date)?.toISOString?.() ?? '',
            marketplace: MarketplaceType.OZON,
            userId: String(userId),
            userEmail: String(user?.email ?? ''),
            connectionId: evidence?.connectionId ? String(evidence.connectionId) : undefined,
            productId: row.productId ? String(row.productId) : undefined,
            productName,
            type: String(row.type ?? ''),
            severity: String(row.severity ?? ''),
            status: String(row.status ?? ''),
            availabilityStatus,
            title: String(row.title ?? ''),
            reason: String(row.reason ?? ''),
            source: this.configService.get<string>('ozon.ai.provider') ?? 'rule-based',
        };
    }

    private resolveAvailability(
        evidence?: Record<string, unknown>,
    ): AvailabilityStatus {
        if (evidence?.notAvailableViaOfficialApi === true) {
            return AvailabilityStatus.NOT_AVAILABLE_VIA_OFFICIAL_API;
        }
        if (evidence?.partial === true) {
            return AvailabilityStatus.PARTIAL;
        }
        if (evidence?.apiError === true) {
            return AvailabilityStatus.API_ERROR;
        }
        return AvailabilityStatus.AVAILABLE;
    }
}
