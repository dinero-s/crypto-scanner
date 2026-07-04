import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';

export const OzonSellerReportTableName = 'ozon_seller_reports';

/** Снимок отчёта Ozon Seller API (/v1/report/*) */
@DatabaseEntity({ collection: OzonSellerReportTableName, timestamps: true })
export class OzonSellerReportEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    connectionId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true, index: true })
    reportCode: string;

    @DatabaseProp({ type: String, required: true })
    reportType: string;

    @DatabaseProp({ type: String, required: true })
    status: string;

    @DatabaseProp({ type: String, required: false })
    fileUrl?: string;

    @DatabaseProp({ type: Date, required: true, index: true })
    collectedAt: Date;
}

export const OzonSellerReportSchema = DatabaseSchema(OzonSellerReportEntity);

OzonSellerReportSchema.index({ connectionId: 1, reportType: 1, collectedAt: -1 });

export type OzonSellerReportDoc = IDatabaseDocument<OzonSellerReportEntity>;
