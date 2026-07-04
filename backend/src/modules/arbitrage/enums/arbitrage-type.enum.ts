/** Тип арбитражной возможности */
export enum ArbitrageTypeEnum {
    FUNDING_RATE = 'funding_rate',
    CASH_AND_CARRY = 'cash_and_carry',
}

/** Направление позиции для funding arb */
export enum FundingDirectionEnum {
    LONG_SPOT_SHORT_PERP = 'long_spot_short_perp',
    SHORT_SPOT_LONG_PERP = 'short_spot_long_perp',
}
