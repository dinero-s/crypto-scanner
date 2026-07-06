/** Форматирование чисел и дат для Mini App */

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatPercent(value: number | null | undefined, digits = 3): string {
  if (!isFiniteNumber(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export function formatRate(value: number | null | undefined, digits = 4): string {
  if (!isFiniteNumber(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPrice(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  }
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 8 });
}

export function formatTimestamp(ms?: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMinutes(minutes?: number): string {
  if (minutes === undefined || minutes === null) return '—';
  if (minutes < 60) return `${String(Math.round(minutes))} мин`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${String(h)} ч ${String(m)} мин` : `${String(h)} ч`;
}

export function formatExchange(exchange: string): string {
  return exchange.charAt(0).toUpperCase() + exchange.slice(1);
}

export function formatPair(base: string, quote: string): string {
  return `${base}/${quote}`;
}

export function estimateProfitUsd(positionSizeUsd: number, netYieldPercent: number): number {
  return (positionSizeUsd * netYieldPercent) / 100;
}
