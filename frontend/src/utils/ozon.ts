import type {
  AvailabilityStatus,
  OzonAuditRunProgressStep,
  OzonDetectorAvailabilityStatus,
  OzonDetectorKey,
  OzonLossCalculationConfidence,
} from '../types/ozon';

export const UNAVAILABLE_MESSAGE =
  'Эта метрика недоступна через официальный API Ozon. Мы не используем парсинг и не обходим ограничения площадки.';

export const PARTIAL_DATA_WARNING =
  'Рекомендация построена на частичных данных. Некоторые метрики недоступны через официальный API Ozon.';

export const LEGAL_NOTICE =
  'Сервис работает только через официальные API Ozon. Мы не используем парсинг витрины, скрытые endpoint\'ы, cookies, CAPTCHA bypass, browser automation или обход лимитов. Если данные недоступны через официальный API, сервис покажет соответствующий статус.';

export function isUnavailableStatus(status?: AvailabilityStatus | string): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return (
    normalized === 'NOT_AVAILABLE_VIA_OFFICIAL_API' ||
    normalized === 'DATA_NOT_AVAILABLE_VIA_OFFICIAL_API' ||
    normalized.includes('NOT_AVAILABLE')
  );
}

export function normalizeAvailability(
  status?: string,
): AvailabilityStatus | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (upper.includes('NOT_AVAILABLE')) return 'NOT_AVAILABLE_VIA_OFFICIAL_API';
  if (upper === 'PARTIAL') return 'PARTIAL';
  if (upper === 'API_ERROR') return 'API_ERROR';
  if (upper === 'PENDING') return 'PENDING';
  return 'AVAILABLE';
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrice(value?: number): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function mapConnectionStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'ACTIVE',
    error: 'ERROR',
    revoked: 'DELETED',
    invalid: 'ERROR',
    checking: 'CHECKING',
  };
  return map[status.toLowerCase()] ?? status.toUpperCase();
}

export function mapSeverity(severity: string): string {
  return severity.toUpperCase();
}

export function getHumanError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Произошла неизвестная ошибка';
}

export function isUrlValidationError(message: string): boolean {
  return (
    message.includes('product_id') ||
    message.includes('SKU') ||
    message.includes('url') ||
    message.includes('ссылк')
  );
}

export const URL_VALIDATION_MESSAGE =
  'Не удалось извлечь product_id или SKU из ссылки. Вставьте корректную ссылку Ozon или укажите ID вручную.';

export function formatLossRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return '—';
  if (min !== undefined && max !== undefined && min > 0 && max > 0) {
    return `${formatPrice(min)} – ${formatPrice(max)}/мес`;
  }
  const value = max ?? min;
  if (value !== undefined && value > 0) return `~${formatPrice(value)}`;
  return '—';
}

export function formatLossDisplay(params: {
  min?: number;
  max?: number;
  confidence?: OzonLossCalculationConfidence | string;
  explanation?: string;
}): { primary: string; secondary?: string } {
  const { min, max, confidence, explanation } = params;
  const hasAmount =
    (min !== undefined && min > 0) || (max !== undefined && max > 0);

  if (!hasAmount) {
    return {
      primary: explanation ?? 'Потери не рассчитаны: недостаточно финансовых данных.',
    };
  }

  const range = formatLossRange(min, max);
  const conf = confidence?.toUpperCase();

  if (conf === 'LOW') {
    return {
      primary: range,
      secondary: 'Оценка потерь: низкая уверенность',
    };
  }

  if (conf === 'MEDIUM') {
    return {
      primary: `Потенциальные потери: ${range}`,
      secondary: explanation,
    };
  }

  return {
    primary: `Потенциальные потери: ${range}`,
    secondary: explanation,
  };
}

export function getProgressStepLabel(step: OzonAuditRunProgressStep | string): string {
  const map: Record<string, string> = {
    QUEUED: 'В очереди',
    SYNC: 'Синхронизация данных Ozon',
    METRICS_BUILD: 'Построение метрик',
    DATA_QUALITY: 'Проверка качества данных',
    ISSUES_DETECT: 'Поиск проблем',
    RECOMMENDATIONS_BUILD: 'Формирование рекомендаций',
    AI_REPORT: 'Генерация AI-отчёта',
    DONE: 'Завершено',
    FAILED: 'Ошибка',
  };
  return map[step] ?? step;
}

export function getDetectorLabel(key: OzonDetectorKey): string {
  const map: Record<OzonDetectorKey, string> = {
    stockoutRisk: 'Остатки (out-of-stock)',
    overstock: 'Неликвид',
    adsWaste: 'Реклама',
    priceLeak: 'Цены',
    returnSpike: 'Возвраты',
  };
  return map[key];
}

export function getDetectorAvailabilityTone(
  status: OzonDetectorAvailabilityStatus | string,
): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const upper = status.toUpperCase();
  if (upper === 'READY') return 'success';
  if (upper === 'PARTIAL') return 'warning';
  return 'neutral';
}

export function getDetectorAvailabilityLabel(
  status: OzonDetectorAvailabilityStatus | string,
): string {
  const map: Record<string, string> = {
    READY: 'Готов',
    PARTIAL: 'Частично',
    NOT_AVAILABLE: 'Недоступен',
  };
  return map[status.toUpperCase()] ?? status;
}

export function getDataQualityStateLabel(state: string): string {
  const map: Record<string, string> = {
    READY: 'Данные полные',
    PARTIAL_DATA: 'Частичные данные',
    INSUFFICIENT_DATA: 'Недостаточно данных',
  };
  return map[state] ?? state;
}

export function buildAuditSummaryFromRun(auditRun?: {
  issuesCount?: number;
  criticalIssuesCount?: number;
  highIssuesCount?: number;
  estimatedLossMin?: number;
  estimatedLossMax?: number;
  lossCalculationConfidence?: string;
}): {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  estimatedLossMin: number;
  estimatedLossMax: number;
  lossCalculationConfidence?: string;
} | undefined {
  if (!auditRun?.issuesCount && auditRun?.issuesCount !== 0) return undefined;
  return {
    totalIssues: auditRun.issuesCount ?? 0,
    criticalIssues: auditRun.criticalIssuesCount ?? 0,
    highIssues: auditRun.highIssuesCount ?? 0,
    estimatedLossMin: auditRun.estimatedLossMin ?? 0,
    estimatedLossMax: auditRun.estimatedLossMax ?? 0,
    lossCalculationConfidence: auditRun.lossCalculationConfidence,
  };
}

export function getAuditSeverityLabel(severity: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'Критично',
    HIGH: 'Высокий',
    MEDIUM: 'Средний',
    LOW: 'Низкий',
  };
  return map[severity.toUpperCase()] ?? severity;
}

export function getAuditSeverityTone(
  severity: string,
): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const upper = severity.toUpperCase();
  if (upper === 'CRITICAL') return 'danger';
  if (upper === 'HIGH') return 'warning';
  if (upper === 'MEDIUM') return 'info';
  return 'neutral';
}

export function getIssueTypeLabel(type: string): string {
  const map: Record<string, string> = {
    STOCKOUT_RISK: 'Риск out-of-stock',
    OVERSTOCK: 'Замороженные остатки',
    ADS_WASTE: 'Неэффективная реклама',
    PRICE_LEAK: 'Снижение цены',
    RETURN_SPIKE: 'Высокие возвраты',
  };
  return map[type] ?? type;
}

export function formatConfidence(value?: number): string {
  if (value === undefined) return '—';
  return `${String(Math.round(value * 100))}%`;
}
