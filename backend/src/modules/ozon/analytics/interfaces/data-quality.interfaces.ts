/** Тип отсутствующих данных для Profit Audit */
export type OzonAuditMissingDataType =
    | 'PRODUCTS'
    | 'PRICES'
    | 'STOCKS'
    | 'SALES'
    | 'FINANCE'
    | 'ADS'
    | 'RETURNS';

/** Описание отсутствующего блока данных */
export interface OzonAuditMissingDataItem {
    type: OzonAuditMissingDataType;
    title: string;
    description: string;
    impact: string;
}

import {
    OzonAuditDataQualityState,
    OzonDetectorAvailabilityStatus,
} from '../../constants/ozon.enums';

/** Доступность одного детектора */
export interface OzonDetectorAvailabilityItem {
    status: OzonDetectorAvailabilityStatus;
    reason?: string;
}

/** Доступность детекторов Profit Audit */
export interface OzonDetectorAvailability {
    stockoutRisk: OzonDetectorAvailabilityItem;
    overstock: OzonDetectorAvailabilityItem;
    adsWaste: OzonDetectorAvailabilityItem;
    priceLeak: OzonDetectorAvailabilityItem;
    returnSpike: OzonDetectorAvailabilityItem;
}

/** Оценка качества данных для Profit Audit */
export interface OzonAuditDataQuality {
    score: number;
    state: OzonAuditDataQualityState;
    hasProductsData: boolean;
    hasPriceData: boolean;
    hasStockData: boolean;
    hasSalesData: boolean;
    hasFinanceData: boolean;
    hasAdsData: boolean;
    hasReturnsData: boolean;
    missingData: OzonAuditMissingDataItem[];
    warnings: string[];
    detectorAvailability: OzonDetectorAvailability;
    checkedDetectorsCount: number;
    availableDetectorsCount: number;
    partialDetectorsCount: number;
    unavailableDetectorsCount: number;
}
