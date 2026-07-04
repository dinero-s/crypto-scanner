import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonAuditActionType,
    OzonAuditRecommendationStatus,
    OzonDetectedIssueStatus,
    OzonDetectedIssueType,
} from '../../constants/ozon.enums';
import {
    OzonAuditRecommendationDoc,
    OzonAuditRecommendationEntity,
} from '../entities/ozon-audit-recommendation.entity';
import {
    OzonDetectedIssueDoc,
    OzonDetectedIssueEntity,
} from '../entities/ozon-detected-issue.entity';
import { BuiltRecommendation } from '../interfaces/audit.interfaces';
import { buildRecommendationKey } from '../utils/audit-key.utils';

const SEVERITY_PRIORITY: Record<string, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
};

/** Построение рекомендаций из обнаруженных проблем */
@Injectable()
export class OzonRecommendationBuilderService {
    private readonly logger = new Logger(OzonRecommendationBuilderService.name);

    constructor(
        @DatabaseModel(OzonAuditRecommendationEntity.name)
        private readonly recommendationModel: Model<OzonAuditRecommendationDoc>,
        @DatabaseModel(OzonDetectedIssueEntity.name)
        private readonly issueModel: Model<OzonDetectedIssueDoc>,
    ) {}

    buildFromIssue(issue: OzonDetectedIssueDoc): BuiltRecommendation {
        switch (issue.type) {
            case OzonDetectedIssueType.STOCKOUT_RISK:
                return {
                    priority: SEVERITY_PRIORITY[issue.severity] ?? 3,
                    actionType: OzonAuditActionType.CHECK_STOCK,
                    title: 'Пополнить остатки товара',
                    description: issue.summary,
                    steps: [
                        'Проверьте остатки по товару.',
                        'Рассчитайте поставку минимум на 30 дней продаж.',
                        'Если поставка невозможна, проверьте цену и рекламу, чтобы не распродать товар слишком быстро.',
                    ],
                    expectedEffectMin: issue.estimatedLossMin,
                    expectedEffectMax: issue.estimatedLossMax,
                    confidence: issue.confidence,
                };
            case OzonDetectedIssueType.OVERSTOCK:
                return {
                    priority: SEVERITY_PRIORITY[issue.severity] ?? 3,
                    actionType: OzonAuditActionType.CLEAR_OVERSTOCK,
                    title: 'Разгрузить замороженные остатки',
                    description: issue.summary,
                    steps: [
                        'Оцените скорость продаж и срок годности товара.',
                        'Рассмотрите акцию или снижение цены для ускорения оборота.',
                        'Снизьте рекламный бюджет, если товар и так продаётся медленно.',
                    ],
                    expectedEffectMin: issue.estimatedLossMin,
                    expectedEffectMax: issue.estimatedLossMax,
                    confidence: issue.confidence,
                };
            case OzonDetectedIssueType.ADS_WASTE:
                return {
                    priority: SEVERITY_PRIORITY[issue.severity] ?? 3,
                    actionType: OzonAuditActionType.REDUCE_AD_SPEND,
                    title: 'Проверить рекламную кампанию',
                    description: issue.summary,
                    steps: [
                        'Проверьте ставки и поисковые фразы.',
                        'Отключите ключи без заказов.',
                        'Снизьте расход на товар, если ДРР выше маржи.',
                    ],
                    expectedEffectMin: issue.estimatedLossMin,
                    expectedEffectMax: issue.estimatedLossMax,
                    confidence: issue.confidence,
                };
            case OzonDetectedIssueType.PRICE_LEAK:
                return {
                    priority: SEVERITY_PRIORITY[issue.severity] ?? 3,
                    actionType: OzonAuditActionType.CHECK_PRICE,
                    title: 'Проверить снижение цены',
                    description: issue.summary,
                    steps: [
                        'Сравните продажи до и после снижения цены.',
                        'Если рост заказов слабый, протестируйте возврат цены.',
                        'Отслеживайте продажи 3–7 дней после изменения.',
                    ],
                    expectedEffectMin: issue.estimatedLossMin,
                    expectedEffectMax: issue.estimatedLossMax,
                    confidence: issue.confidence,
                };
            case OzonDetectedIssueType.RETURN_SPIKE:
                return {
                    priority: SEVERITY_PRIORITY[issue.severity] ?? 3,
                    actionType: OzonAuditActionType.CHECK_RETURNS,
                    title: 'Проверить причины возвратов',
                    description: issue.summary,
                    steps: [
                        'Изучите причины возвратов в личном кабинете Ozon.',
                        'Проверьте описание, фото и комплектацию товара.',
                        'Сравните с конкурентами и обновите карточку при необходимости.',
                    ],
                    expectedEffectMin: issue.estimatedLossMin,
                    expectedEffectMax: issue.estimatedLossMax,
                    confidence: issue.confidence,
                };
            default:
                return {
                    priority: 5,
                    actionType: OzonAuditActionType.CHECK_STOCK,
                    title: issue.title,
                    description: issue.summary,
                    steps: ['Проверьте показатели товара в личном кабинете Ozon.'],
                    confidence: issue.confidence,
                };
        }
    }

    async buildForIssues(
        userId: string,
        integrationId: string,
        issues: OzonDetectedIssueDoc[],
        auditRunId: string,
        periodFrom: Date,
        periodTo: Date,
    ): Promise<OzonAuditRecommendationDoc[]> {
        const saved: OzonAuditRecommendationDoc[] = [];

        if (issues.length === 0) {
            return saved;
        }

        const recommendationKeys = issues.map((issue) =>
            buildRecommendationKey(
                userId,
                integrationId,
                issue.offerId,
                issue.productId,
                issue.type,
            ),
        );

        const existingRecommendations = await this.recommendationModel
            .find({
                userId: new Types.ObjectId(userId),
                recommendationKey: { $in: recommendationKeys },
                status: {
                    $in: [
                        OzonAuditRecommendationStatus.NEW,
                        OzonAuditRecommendationStatus.VIEWED,
                    ],
                },
            })
            .exec();

        const existingByKey = new Map(
            existingRecommendations.map((rec) => [rec.recommendationKey, rec]),
        );

        const bulkOps: Array<{
            updateOne: {
                filter: Record<string, unknown>;
                update: Record<string, unknown>;
                upsert?: boolean;
            };
        }> = [];

        for (const issue of issues) {
            const recommendationKey = buildRecommendationKey(
                userId,
                integrationId,
                issue.offerId,
                issue.productId,
                issue.type,
            );
            const built = this.buildFromIssue(issue);
            const existing = existingByKey.get(recommendationKey);

            if (existing) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: existing._id },
                        update: {
                            $set: {
                                issueId: issue._id,
                                productId: issue.productId,
                                offerId: issue.offerId,
                                sku: issue.sku,
                                priority: built.priority,
                                actionType: built.actionType,
                                title: built.title,
                                description: built.description,
                                steps: built.steps,
                                expectedEffectMin: built.expectedEffectMin,
                                expectedEffectMax: built.expectedEffectMax,
                                estimatedLossMin: issue.estimatedLossMin,
                                estimatedLossMax: issue.estimatedLossMax,
                                lossCalculationConfidence: issue.lossCalculationConfidence,
                                lossExplanation: issue.lossExplanation,
                                confidence: built.confidence,
                                auditRunId: new Types.ObjectId(auditRunId),
                                issueKey: issue.issueKey,
                                periodFrom,
                                periodTo,
                            },
                        },
                    },
                });
                continue;
            }

            bulkOps.push({
                updateOne: {
                    filter: {
                        userId: issue.userId,
                        recommendationKey,
                    },
                    update: {
                        $setOnInsert: {
                            userId: issue.userId,
                            integrationId: issue.integrationId,
                            issueId: issue._id,
                            productId: issue.productId,
                            offerId: issue.offerId,
                            sku: issue.sku,
                            priority: built.priority,
                            actionType: built.actionType,
                            title: built.title,
                            description: built.description,
                            steps: built.steps,
                            expectedEffectMin: built.expectedEffectMin,
                            expectedEffectMax: built.expectedEffectMax,
                            estimatedLossMin: issue.estimatedLossMin,
                            estimatedLossMax: issue.estimatedLossMax,
                            lossCalculationConfidence: issue.lossCalculationConfidence,
                            lossExplanation: issue.lossExplanation,
                            confidence: built.confidence,
                            status: OzonAuditRecommendationStatus.NEW,
                            recommendationKey,
                            auditRunId: new Types.ObjectId(auditRunId),
                            issueKey: issue.issueKey,
                            periodFrom,
                            periodTo,
                        },
                    },
                    upsert: true,
                },
            });
        }

        if (bulkOps.length > 0) {
            await this.recommendationModel.bulkWrite(bulkOps, { ordered: false });
        }

        const persisted = await this.recommendationModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                auditRunId: new Types.ObjectId(auditRunId),
            })
            .exec();

        saved.push(...persisted);

        this.logger.log(
            `built recommendations userId=${userId} count=${String(saved.length)}`,
        );

        return saved;
    }

    async buildForIntegration(
        userId: string,
        integrationId: string,
        auditRunId: string,
        periodFrom: Date,
        periodTo: Date,
    ): Promise<OzonAuditRecommendationDoc[]> {
        const issues = await this.issueModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                status: {
                    $in: [
                        OzonDetectedIssueStatus.NEW,
                        OzonDetectedIssueStatus.VIEWED,
                    ],
                },
            })
            .exec();

        return this.buildForIssues(
            userId,
            integrationId,
            issues,
            auditRunId,
            periodFrom,
            periodTo,
        );
    }
}
