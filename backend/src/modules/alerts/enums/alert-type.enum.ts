/** Тип алерта */
export enum AlertTypeEnum {
    FUNDING_RATE = 'funding_rate',
    CASH_AND_CARRY = 'cash_and_carry',
    CUSTOM = 'custom',
}

/** Статус доставки */
export enum AlertDeliveryStatusEnum {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
}
