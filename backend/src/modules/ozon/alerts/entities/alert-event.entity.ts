import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { AlertEventStatus, AlertEventType, OzonSeverity } from '../../constants/ozon.enums';

export const AlertEventTableName = 'ozon_alert_events';

/** Событие уведомления пользователю */
@DatabaseEntity({ collection: AlertEventTableName, timestamps: true })
export class AlertEventEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    userId: Types.ObjectId;

    @DatabaseProp({ type: String, enum: Object.values(AlertEventType), required: true, index: true })
    type: AlertEventType;

    @DatabaseProp({ type: String, enum: Object.values(OzonSeverity), required: true, index: true })
    severity: OzonSeverity;

    @DatabaseProp({ type: String, required: false })
    productId?: string;

    @DatabaseProp({ type: Types.ObjectId, required: false })
    competitorProductId?: Types.ObjectId;

    @DatabaseProp({ type: String, required: true })
    message: string;

    @DatabaseProp({ type: Object, required: false })
    payload?: Record<string, unknown>;

    @DatabaseProp({
        type: String,
        enum: Object.values(AlertEventStatus),
        default: AlertEventStatus.PENDING,
        index: true,
    })
    status: AlertEventStatus;

    @DatabaseProp({ type: Date, required: false })
    sentAt?: Date;
}

export const AlertEventSchema = DatabaseSchema(AlertEventEntity);

AlertEventSchema.index({ userId: 1, status: 1, createdAt: -1 });
AlertEventSchema.index({ userId: 1, productId: 1, createdAt: -1 });
AlertEventSchema.index({ type: 1, severity: 1 });

export type AlertEventDoc = IDatabaseDocument<AlertEventEntity>;
