/** Причина недоступности данных конкурента */
export type CompetitorDataUnavailableReason =
    | 'OFFICIAL_DATA_NOT_AVAILABLE'
    | 'INVALID_URL'
    | 'API_ERROR';

/** Данные карточки конкурента из разрешённого источника */
export interface CompetitorProductDataPayload {
    price?: number;
    oldPrice?: number;
    discountPercent?: number;
    rating?: number;
    reviewsCount?: number;
    availability?: string;
    sellerName?: string;
    name?: string;
    brand?: string;
    rawAvailableFields: string[];
}

/** Результат запроса данных конкурента */
export interface CompetitorProductDataResult {
    success: boolean;
    reason?: CompetitorDataUnavailableReason;
    message?: string;
    data?: CompetitorProductDataPayload;
}

/** Адаптер получения данных конкурента (только легальные методы) */
export interface OzonCompetitorDataProvider {
    getProductDataByUrl(
        credentials: { clientId: string; apiKey: string },
        url: string,
        productId: string | undefined,
        sku: string | undefined,
        userId?: string,
    ): Promise<CompetitorProductDataResult>;
}
