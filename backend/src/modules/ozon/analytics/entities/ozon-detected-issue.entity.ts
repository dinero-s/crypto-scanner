import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import {
    OzonAuditSeverity,
    OzonDetectedIssueStatus,
    OzonDetectedIssueType,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import { IssueEvidence } from '../interfaces/audit.interfaces';

export const OzonDetectedIssueTableName = 'ozon_detected_issues';

/** Обнаруженная проблема / потеря в магазине Ozon */
@DatabaseEntity({ collection: OzonDetectedIssueTableName, timestamps: true })
export class OzonDetectedIssueEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: true, index: true })
    integrationId: Types.ObjectId;

    @DatabaseProp({ type: String, required: false, index: true })
    productId?: string;

    @DatabaseProp({ type: String, required: false, index: true })
    offerId?: string;

    @DatabaseProp({ type: String, required: false })
    sku?: string;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonDetectedIssueType),
        required: true,
        index: true,
    })
    type: OzonDetectedIssueType;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonAuditSeverity),
        required: true,
    })
    severity: OzonAuditSeverity;

    @DatabaseProp({ type: Number, required: true, min: 0, max: 1 })
    confidence: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMin?: number;

    @DatabaseProp({ type: Number, required: false })
    estimatedLossMax?: number;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonLossCalculationConfidence),
        required: true,
    })
    lossCalculationConfidence: OzonLossCalculationConfidence;

    @DatabaseProp({ type: String, required: false })
    lossExplanation?: string;

    @DatabaseProp({ type: String, required: true, index: true })
    issueKey: string;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonAuditRunEntity', required: false })
    auditRunId?: Types.ObjectId;

    @DatabaseProp({ type: Date, required: true })
    periodFrom: Date;

    @DatabaseProp({ type: Date, required: true })
    periodTo: Date;

    @DatabaseProp({ type: String, required: true })
    title: string;

    @DatabaseProp({ type: String, required: true })
    summary: string;

    @DatabaseProp({ type: [Object], required: true })
    evidence: IssueEvidence[];

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonDetectedIssueStatus),
        default: OzonDetectedIssueStatus.NEW,
        index: true,
    })
    status: OzonDetectedIssueStatus;

    @DatabaseProp({ type: Date, required: true, index: true })
    detectedAt: Date;
}

export const OzonDetectedIssueSchema = DatabaseSchema(OzonDetectedIssueEntity);

OzonDetectedIssueSchema.index({ userId: 1, status: 1, detectedAt: -1 });
OzonDetectedIssueSchema.index({ userId: 1, integrationId: 1, status: 1, detectedAt: -1 });
OzonDetectedIssueSchema.index({ userId: 1, type: 1, detectedAt: -1 });
OzonDetectedIssueSchema.index({ userId: 1, offerId: 1, detectedAt: -1 });
OzonDetectedIssueSchema.index({ userId: 1, issueKey: 1, status: 1 });

export type OzonDetectedIssueDoc = IDatabaseDocument<OzonDetectedIssueEntity>;
