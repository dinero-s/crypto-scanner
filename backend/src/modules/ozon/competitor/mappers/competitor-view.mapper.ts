import { CompetitorProductDoc } from '../entities/competitor-product.entity';
import { CompetitorProductStatus } from '../../constants/ozon.enums';

/** API-представление карточки конкурента */
export interface CompetitorProductView {
    id: string;
    connectionId: string;
    url?: string;
    marketplace: string;
    externalProductId?: string;
    productId?: string;
    sku?: string;
    offerId?: string;
    urlReference?: string;
    name?: string;
    title?: string;
    sellerName?: string;
    brand?: string;
    status: string;
    lastPrice?: number;
    lastOldPrice?: number;
    lastRating?: number;
    lastReviewsCount?: number;
    lastAvailability?: string;
    lastSyncedAt?: Date;
    lastError?: string;
    price?: number;
    rating?: number;
    reviewsCount?: number;
    availabilityStatus?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export function toCompetitorView(doc: CompetitorProductDoc): CompetitorProductView {
    const availabilityStatus =
        doc.status === CompetitorProductStatus.DATA_NOT_AVAILABLE ||
        doc.status === CompetitorProductStatus.ERROR
            ? 'NOT_AVAILABLE_VIA_OFFICIAL_API'
            : doc.lastAvailability;

    return {
        id: String(doc._id),
        connectionId: String(doc.connectionId),
        url: doc.url ?? doc.urlReference,
        marketplace: doc.marketplace ?? 'OZON',
        externalProductId: doc.externalProductId ?? doc.productId,
        productId: doc.productId,
        sku: doc.sku,
        offerId: doc.offerId,
        urlReference: doc.urlReference ?? doc.url,
        name: doc.name ?? doc.title,
        title: doc.title ?? doc.name,
        sellerName: doc.sellerName,
        brand: doc.brand,
        status: doc.status,
        lastPrice: doc.lastPrice,
        lastOldPrice: doc.lastOldPrice,
        lastRating: doc.lastRating,
        lastReviewsCount: doc.lastReviewsCount,
        lastAvailability: doc.lastAvailability,
        lastSyncedAt: doc.lastSyncedAt,
        lastError: doc.lastError,
        price: doc.lastPrice,
        rating: doc.lastRating,
        reviewsCount: doc.lastReviewsCount,
        availabilityStatus,
        createdAt: (doc as { createdAt?: Date }).createdAt,
        updatedAt: (doc as { updatedAt?: Date }).updatedAt,
    };
}
