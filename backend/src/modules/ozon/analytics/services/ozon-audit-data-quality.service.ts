import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonAuditDataQualityState,
    OzonDetectorAvailabilityStatus,
} from '../../constants/ozon.enums';
import {
    OzonAuditDataQuality,
    OzonAuditMissingDataItem,
    OzonAuditMissingDataType,
    OzonDetectorAvailability,
    OzonDetectorAvailabilityItem,
} from '../interfaces/data-quality.interfaces';
import {
    OzonMetricSnapshotDoc,
    OzonMetricSnapshotEntity,
} from '../entities/ozon-metric-snapshot.entity';
import {
    SellerProductDoc,
    SellerProductEntity,
} from '../../seller/entities/seller-product.entity';
import {
    OzonSellerReportDoc,
    OzonSellerReportEntity,
} from '../../seller/entities/ozon-seller-report.entity';
import { startOfDayUtc } from '../metrics/metric-utils';
import { AuditPeriodDays } from './ozon-audit-run.service';

const MISSING_DATA_CATALOG: Record<
    OzonAuditMissingDataType,
    Omit<OzonAuditMissingDataItem, 'type'>
> = {
    PRODUCTS: {
        title: 'Нет данных о товарах',
        description: 'Seller API не вернул товары или синхронизация ещё не выполнена.',
        impact: 'Аудит невозможен без каталога товаров.',
    },
    PRICES: {
        title: 'Нет ценовых данных',
        description: 'В синхронизированных товарах отсутствуют актуальные цены.',
        impact: 'Рекомендации по утечке прибыли и марже недоступны.',
    },
    STOCKS: {
        title: 'Нет данных об остатках',
        description: 'Seller API не вернул остатки по товарам.',
        impact: 'Детекторы out-of-stock и overstock не сработают.',
    },
    SALES: {
        title: 'Нет данных о продажах',
        description: 'Statistics API не вернул продажи за анализируемый период.',
        impact: 'Оценка потерь и динамика спроса будут неполными.',
    },
    FINANCE: {
        title: 'Нет финансовых данных',
        description: 'Finance API не подключен или не вернул отчёты.',
        impact: 'Точная прибыль и маржа не рассчитываются.',
    },
    ADS: {
        title: 'Нет рекламных данных',
        description: 'Performance API не подключен или не вернул данные.',
        impact: 'Мы не можем рассчитать потери по рекламе и ДРР.',
    },
    RETURNS: {
        title: 'Нет данных о возвратах',
        description: 'Statistics API не вернул возвраты за период.',
        impact: 'Детектор всплеска возвратов будет пропущен.',
    },
};

type DataFlags = {
    hasProductsData: boolean;
    hasPriceData: boolean;
    hasStockData: boolean;
    hasSalesData: boolean;
    hasFinanceData: boolean;
    hasAdsData: boolean;
    hasReturnsData: boolean;
    hasPriceHistory: boolean;
    hasEnoughHistory: boolean;
};

/** Оценка полноты данных перед Profit Audit */
@Injectable()
export class OzonAuditDataQualityService {
    constructor(
        @DatabaseModel(SellerProductEntity.name)
        private readonly sellerProductModel: Model<SellerProductDoc>,
        @DatabaseModel(OzonMetricSnapshotEntity.name)
        private readonly metricSnapshotModel: Model<OzonMetricSnapshotDoc>,
        @DatabaseModel(OzonSellerReportEntity.name)
        private readonly sellerReportModel: Model<OzonSellerReportDoc>,
    ) {}

    async assess(
        userId: string,
        integrationId: string,
        periodDays: AuditPeriodDays = 30,
    ): Promise<OzonAuditDataQuality> {
        const from = startOfDayUtc(
            new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000),
        );

        const [products, snapshots, financeReports] = await Promise.all([
            this.sellerProductModel
                .find({
                    userId: new Types.ObjectId(userId),
                    connectionId: new Types.ObjectId(integrationId),
                })
                .exec(),
            this.metricSnapshotModel
                .find({
                    userId: new Types.ObjectId(userId),
                    integrationId: new Types.ObjectId(integrationId),
                    date: { $gte: from },
                })
                .exec(),
            this.sellerReportModel
                .find({
                    userId: new Types.ObjectId(userId),
                    connectionId: new Types.ObjectId(integrationId),
                })
                .limit(1)
                .exec(),
        ]);

        const flags = this.buildFlags(products, snapshots, financeReports, periodDays);
        const missingData = this.buildMissingData(flags);
        const detectorAvailability = this.buildDetectorAvailability(flags, periodDays);
        const warnings = this.buildWarnings(flags, missingData);
        const score = this.calculateScore(flags);
        const state = this.resolveState(score);
        const counts = this.countDetectorAvailability(detectorAvailability);

        return {
            score,
            state,
            hasProductsData: flags.hasProductsData,
            hasPriceData: flags.hasPriceData,
            hasStockData: flags.hasStockData,
            hasSalesData: flags.hasSalesData,
            hasFinanceData: flags.hasFinanceData,
            hasAdsData: flags.hasAdsData,
            hasReturnsData: flags.hasReturnsData,
            missingData,
            warnings,
            detectorAvailability,
            ...counts,
        };
    }

    isDetectorEnabled(
        dataQuality: OzonAuditDataQuality,
        detector: keyof OzonDetectorAvailability,
    ): boolean {
        const availability = dataQuality.detectorAvailability[detector];
        return availability.status !== OzonDetectorAvailabilityStatus.NOT_AVAILABLE;
    }

    private buildFlags(
        products: SellerProductDoc[],
        snapshots: OzonMetricSnapshotDoc[],
        financeReports: OzonSellerReportDoc[],
        periodDays: AuditPeriodDays,
    ): DataFlags {
        const hasProductsData = products.length > 0;
        const hasPriceData =
            products.some((p) => p.price !== undefined && p.price > 0) ||
            snapshots.some((s) => s.price !== undefined && s.price > 0);
        const hasStockData =
            products.some((p) => p.stockPresent !== undefined) ||
            snapshots.some((s) => s.stockAvailable !== undefined);
        const hasSalesData = snapshots.some(
            (s) => s.unitsSold !== undefined && s.unitsSold > 0,
        );
        const hasFinanceData =
            financeReports.length > 0 ||
            snapshots.some(
                (s) =>
                    s.grossProfitEstimate !== undefined ||
                    s.marginPercent !== undefined,
            );
        const hasAdsData = snapshots.some(
            (s) => s.adSpend !== undefined && s.adSpend > 0,
        );
        const hasReturnsData = snapshots.some(
            (s) => s.returnsCount !== undefined && s.returnsCount > 0,
        );

        const uniqueDates = new Set(
            snapshots
                .filter((s) => s.date instanceof Date)
                .map((s) => s.date.toISOString().slice(0, 10)),
        );
        const hasEnoughHistory = uniqueDates.size >= Math.min(periodDays, 14);

        const priceDates = new Set(
            snapshots
                .filter((s) => s.date instanceof Date && s.price !== undefined && s.price > 0)
                .map((s) => s.date.toISOString().slice(0, 10)),
        );
        const hasPriceHistory = priceDates.size >= 14;

        return {
            hasProductsData,
            hasPriceData,
            hasStockData,
            hasSalesData,
            hasFinanceData,
            hasAdsData,
            hasReturnsData,
            hasPriceHistory,
            hasEnoughHistory,
        };
    }

    private buildDetectorAvailability(
        flags: DataFlags,
        periodDays: AuditPeriodDays,
    ): OzonDetectorAvailability {
        return {
            stockoutRisk: this.resolveStockoutAvailability(flags),
            overstock: this.resolveOverstockAvailability(flags),
            adsWaste: this.resolveAdsWasteAvailability(flags),
            priceLeak: this.resolvePriceLeakAvailability(flags, periodDays),
            returnSpike: this.resolveReturnSpikeAvailability(flags),
        };
    }

    private resolveStockoutAvailability(flags: DataFlags): OzonDetectorAvailabilityItem {
        if (!flags.hasProductsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRODUCTS_DATA' };
        }
        if (!flags.hasStockData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_STOCK_DATA' };
        }
        if (!flags.hasSalesData) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NO_SALES_DATA' };
        }
        return { status: OzonDetectorAvailabilityStatus.READY };
    }

    private resolveOverstockAvailability(flags: DataFlags): OzonDetectorAvailabilityItem {
        if (!flags.hasProductsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRODUCTS_DATA' };
        }
        if (!flags.hasStockData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_STOCK_DATA' };
        }
        if (!flags.hasSalesData) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NO_SALES_DATA' };
        }
        return { status: OzonDetectorAvailabilityStatus.READY };
    }

    private resolveAdsWasteAvailability(flags: DataFlags): OzonDetectorAvailabilityItem {
        if (!flags.hasProductsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRODUCTS_DATA' };
        }
        if (!flags.hasAdsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_ADS_DATA' };
        }
        return { status: OzonDetectorAvailabilityStatus.READY };
    }

    private resolvePriceLeakAvailability(
        flags: DataFlags,
        periodDays: AuditPeriodDays,
    ): OzonDetectorAvailabilityItem {
        if (!flags.hasProductsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRODUCTS_DATA' };
        }
        if (!flags.hasPriceData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRICE_HISTORY' };
        }
        if (!flags.hasPriceHistory) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NO_PRICE_HISTORY' };
        }
        if (!flags.hasSalesData) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NO_SALES_DATA' };
        }
        if (!flags.hasEnoughHistory && periodDays >= 30) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NOT_ENOUGH_HISTORY' };
        }
        return { status: OzonDetectorAvailabilityStatus.READY };
    }

    private resolveReturnSpikeAvailability(flags: DataFlags): OzonDetectorAvailabilityItem {
        if (!flags.hasProductsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_PRODUCTS_DATA' };
        }
        if (!flags.hasReturnsData) {
            return { status: OzonDetectorAvailabilityStatus.NOT_AVAILABLE, reason: 'NO_RETURNS_DATA' };
        }
        if (!flags.hasSalesData) {
            return { status: OzonDetectorAvailabilityStatus.PARTIAL, reason: 'NO_SALES_DATA' };
        }
        return { status: OzonDetectorAvailabilityStatus.READY };
    }

    private countDetectorAvailability(availability: OzonDetectorAvailability): {
        checkedDetectorsCount: number;
        availableDetectorsCount: number;
        partialDetectorsCount: number;
        unavailableDetectorsCount: number;
    } {
        const items = Object.values(availability);
        return {
            checkedDetectorsCount: items.length,
            availableDetectorsCount: items.filter(
                (item) => item.status === OzonDetectorAvailabilityStatus.READY,
            ).length,
            partialDetectorsCount: items.filter(
                (item) => item.status === OzonDetectorAvailabilityStatus.PARTIAL,
            ).length,
            unavailableDetectorsCount: items.filter(
                (item) => item.status === OzonDetectorAvailabilityStatus.NOT_AVAILABLE,
            ).length,
        };
    }

    private resolveState(score: number): OzonAuditDataQualityState {
        if (score >= 80) {
            return OzonAuditDataQualityState.READY;
        }
        if (score >= 40) {
            return OzonAuditDataQualityState.PARTIAL_DATA;
        }
        return OzonAuditDataQualityState.INSUFFICIENT_DATA;
    }

    private buildMissingData(flags: DataFlags): OzonAuditMissingDataItem[] {
        const mapping: Array<[boolean, OzonAuditMissingDataType]> = [
            [flags.hasProductsData, 'PRODUCTS'],
            [flags.hasPriceData, 'PRICES'],
            [flags.hasStockData, 'STOCKS'],
            [flags.hasSalesData, 'SALES'],
            [flags.hasFinanceData, 'FINANCE'],
            [flags.hasAdsData, 'ADS'],
            [flags.hasReturnsData, 'RETURNS'],
        ];

        return mapping
            .filter(([present]) => !present)
            .map(([, type]) => ({
                type,
                ...MISSING_DATA_CATALOG[type],
            }));
    }

    private buildWarnings(
        flags: DataFlags,
        missingData: OzonAuditMissingDataItem[],
    ): string[] {
        const warnings: string[] = [];

        if (!flags.hasProductsData) {
            warnings.push('Аудит невозможен: нет синхронизированных товаров.');
            return warnings;
        }

        if (missingData.length > 0) {
            const labels = missingData.map((item) => item.title.toLowerCase()).join(', ');
            warnings.push(`Аудит выполнен частично: недоступны ${labels}.`);
        }

        if (!flags.hasFinanceData) {
            warnings.push(
                'Точная прибыль не рассчитывается — нет финансовых данных.',
            );
        }

        if (!flags.hasAdsData) {
            warnings.push('Рекламные рекомендации недоступны.');
        }

        return warnings;
    }

    private calculateScore(flags: DataFlags): number {
        const weights: Array<[boolean, number]> = [
            [flags.hasProductsData, 25],
            [flags.hasPriceData, 15],
            [flags.hasStockData, 15],
            [flags.hasSalesData, 15],
            [flags.hasFinanceData, 10],
            [flags.hasAdsData, 10],
            [flags.hasReturnsData, 10],
        ];

        const total = weights.reduce((acc, [, w]) => acc + w, 0);
        const earned = weights.reduce(
            (acc, [present, w]) => acc + (present ? w : 0),
            0,
        );

        return Math.round((earned / total) * 100);
    }
}
