import { AlertTypeEnum } from '../enums/alert-type.enum';

/** Payload job отправки алерта */
export interface AlertDispatchJobData {
    telegramUserId: string;
    telegramChatId: string;
    alertType: AlertTypeEnum;
    message: string;
    fingerprint: string;
    deliveryId: string;
    calculatedAt: number;
}
