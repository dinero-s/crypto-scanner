import { MetricSnapshotView } from '../interfaces/audit.interfaces';

/** Начало календарного дня UTC */
export function startOfDayUtc(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Сумма поля за период снимков */
export function sumMetric(
    snapshots: MetricSnapshotView[],
    field: keyof MetricSnapshotView,
): number {
    return snapshots.reduce((acc, snapshot) => {
        const value = snapshot[field];
        return acc + (typeof value === 'number' ? value : 0);
    }, 0);
}

/** Среднее дневное значение за период */
export function avgDailyMetric(
    snapshots: MetricSnapshotView[],
    field: keyof MetricSnapshotView,
    days: number,
): number {
    if (days <= 0) {
        return 0;
    }
    return sumMetric(snapshots, field) / days;
}

/** Фильтр снимков за последние N дней от referenceDate */
export function filterLastDays(
    snapshots: MetricSnapshotView[],
    days: number,
    referenceDate: Date,
): MetricSnapshotView[] {
    const from = startOfDayUtc(new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000));
    return snapshots.filter((snapshot) => snapshot.date >= from);
}

/** Были ли продажи за период */
export function hadSalesInPeriod(
    snapshots: MetricSnapshotView[],
    days: number,
    referenceDate: Date,
): boolean {
    const period = filterLastDays(snapshots, days, referenceDate);
    return sumMetric(period, 'unitsSold') > 0;
}

/** Последний снимок по дате */
export function latestSnapshot(
    snapshots: MetricSnapshotView[],
): MetricSnapshotView | undefined {
    if (snapshots.length === 0) {
        return undefined;
    }
    return [...snapshots].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

/** Преобразование Mongo-документа в MetricSnapshotView */
export function toMetricView(doc: {
    userId: { toString(): string };
    integrationId: { toString(): string };
    productId: string;
    offerId?: string;
    sku?: string;
    date: Date;
    revenue?: number;
    ordersCount?: number;
    unitsSold?: number;
    stockAvailable?: number;
    stockDaysLeft?: number;
    price?: number;
    oldPrice?: number;
    discountPercent?: number;
    adSpend?: number;
    adOrders?: number;
    drr?: number;
    acos?: number;
    returnsCount?: number;
    returnsRate?: number;
    grossProfitEstimate?: number;
    marginPercent?: number;
    views?: number;
    clicks?: number;
    ctr?: number;
    conversionRate?: number;
}): MetricSnapshotView {
    return {
        userId: doc.userId.toString(),
        integrationId: doc.integrationId.toString(),
        productId: doc.productId,
        offerId: doc.offerId,
        sku: doc.sku,
        date: doc.date,
        revenue: doc.revenue,
        ordersCount: doc.ordersCount,
        unitsSold: doc.unitsSold,
        stockAvailable: doc.stockAvailable,
        stockDaysLeft: doc.stockDaysLeft,
        price: doc.price,
        oldPrice: doc.oldPrice,
        discountPercent: doc.discountPercent,
        adSpend: doc.adSpend,
        adOrders: doc.adOrders,
        drr: doc.drr,
        acos: doc.acos,
        returnsCount: doc.returnsCount,
        returnsRate: doc.returnsRate,
        grossProfitEstimate: doc.grossProfitEstimate,
        marginPercent: doc.marginPercent,
        views: doc.views,
        clicks: doc.clicks,
        ctr: doc.ctr,
        conversionRate: doc.conversionRate,
    };
}

/** Группировка снимков по productId */
export function groupSnapshotsByProduct(
    snapshots: MetricSnapshotView[],
): Map<string, MetricSnapshotView[]> {
    const map = new Map<string, MetricSnapshotView[]>();
    for (const snapshot of snapshots) {
        const list = map.get(snapshot.productId) ?? [];
        list.push(snapshot);
        map.set(snapshot.productId, list);
    }
    return map;
}
