/** Вердикт сделки по итоговому net P&L */
export type TradeVerdict = 'profitable' | 'marginal' | 'unprofitable';

export function parseTradeVerdict(value: unknown): TradeVerdict | undefined {
  if (value === 'profitable' || value === 'marginal' || value === 'unprofitable') {
    return value;
  }
  return undefined;
}

export function getTradeVerdictLabel(verdict: TradeVerdict): string {
  switch (verdict) {
    case 'profitable':
      return 'Прибыльно';
    case 'marginal':
      return 'На грани';
    case 'unprofitable':
      return 'Убыточно';
  }
}

export function getTradeVerdictFromNet(totalNetPercent: number): TradeVerdict {
  if (totalNetPercent > 0.05) {
    return 'profitable';
  }
  if (totalNetPercent < -0.05) {
    return 'unprofitable';
  }
  return 'marginal';
}

export function readTotalNetPercent(
  netYieldPercent: number,
  metadata?: Record<string, number | string | boolean>,
): number {
  const fromMeta = metadata?.totalNetAfterEntryPercent;
  if (typeof fromMeta === 'number') {
    return fromMeta;
  }
  return netYieldPercent;
}

export function readTradeVerdict(
  totalNetPercent: number,
  metadata?: Record<string, number | string | boolean>,
): TradeVerdict {
  const fromMeta = parseTradeVerdict(metadata?.tradeVerdict);
  if (fromMeta) {
    return fromMeta;
  }
  return getTradeVerdictFromNet(totalNetPercent);
}
