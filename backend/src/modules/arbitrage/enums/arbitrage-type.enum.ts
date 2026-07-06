/** Тип арбитражной возможности */
export enum ArbitrageTypeEnum {
    FUNDING = 'funding',
    CASH_CARRY = 'cash_carry',
}

/** Направление позиции для funding arb */
export enum FundingDirectionEnum {
    LONG_SPOT_SHORT_PERP = 'long_spot_short_perp',
    SHORT_SPOT_LONG_PERP = 'short_spot_long_perp',
}

/** Вердикт сделки по итоговому net P&L */
export enum TradeVerdictEnum {
    PROFITABLE = 'profitable',
    MARGINAL = 'marginal',
    UNPROFITABLE = 'unprofitable',
}
