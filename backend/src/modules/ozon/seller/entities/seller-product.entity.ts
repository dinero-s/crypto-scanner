import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export const SellerProductTableName = 'ozon_seller_products';

/** Товар продавца из Ozon Seller API */
@DatabaseEntity({ collection: SellerProductTableName, timestamps: true })
export class SellerProductEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    connectionId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true, index: true })
    productId: string;

    @DatabaseProp({ type: String, required: false, index: true })
    offerId?: string;

    @DatabaseProp({ type: String, required: false, index: true })
    sku?: string;

    @DatabaseProp({ type: String, required: false })
    title?: string;

    @DatabaseProp({ type: Number, required: false })
    price?: number;

    @DatabaseProp({ type: Number, required: false })
    oldPrice?: number;

    @DatabaseProp({ type: Number, required: false })
    marketingPrice?: number;

    @DatabaseProp({ type: Number, required: false, default: 0 })
    stockPresent: number;

    @DatabaseProp({ type: Number, required: false, default: 0 })
    stockReserved: number;

    @DatabaseProp({ type: Date, required: false })
    lastSyncedAt?: Date;
}

export const SellerProductSchema = DatabaseSchema(SellerProductEntity);

SellerProductSchema.index({ userId: 1, connectionId: 1 });
SellerProductSchema.index({ connectionId: 1, productId: 1 }, { unique: true });
SellerProductSchema.index({ offerId: 1 });
SellerProductSchema.index({ updatedAt: -1 });

export type SellerProductDoc = IDatabaseDocument<SellerProductEntity>;
