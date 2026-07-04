/** Русские подписи для админ-панели */

export const ADMIN_NAV = [
  { to: '/admin/overview', label: 'Обзор', icon: '📊' },
  { to: '/admin/users', label: 'Пользователи', icon: '👥' },
  { to: '/admin/connections', label: 'Подключения', icon: '🔗' },
  { to: '/admin/jobs', label: 'Задачи синхронизации', icon: '⚙️' },
  { to: '/admin/compliance', label: 'Логи соответствия', icon: '🛡️' },
  { to: '/admin/audit', label: 'Журнал аудита', icon: '📋' },
  { to: '/admin/alerts', label: 'Оповещения', icon: '🔔' },
  { to: '/admin/recommendations', label: 'Рекомендации', icon: '💡' },
  { to: '/admin/health', label: 'Состояние системы', icon: '❤️' },
  { to: '/admin/feature-flags', label: 'Флаги функций', icon: '🚩' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  OK: 'В норме',
  ACTIVE: 'Активен',
  SENT: 'Отправлено',
  ALLOWED: 'Разрешено',
  COMPLETED: 'Завершено',
  DEGRADED: 'Снижена',
  PARTIAL: 'Частично',
  RETRYING: 'Повтор',
  DELAYED: 'Отложено',
  PENDING: 'Ожидание',
  SKIPPED: 'Пропущено',
  DOWN: 'Недоступен',
  FAILED: 'Ошибка',
  BLOCKED: 'Заблокирован',
  ERROR: 'Ошибка',
  INVALID: 'Некорректно',
  CANCELLED: 'Отменено',
  WAITING: 'В очереди',
  NOT_AVAILABLE_VIA_OFFICIAL_API: 'Недоступно через API',
  UNKNOWN: 'Неизвестно',
};

const SERVICE_LABELS: Record<string, string> = {
  backend: 'Backend',
  mongo: 'MongoDB',
  redis: 'Redis',
  bullmq: 'BullMQ',
};

const CONNECTION_ACTION_LABELS: Record<string, string> = {
  health: 'проверку здоровья',
  sync: 'синхронизацию',
  pause: 'паузу',
  resume: 'возобновление',
  delete: 'удаление',
};

const JOB_ACTION_LABELS: Record<string, string> = {
  retry: 'повтор',
  cancel: 'отмену',
};

export function translateStatus(status?: string): string {
  const normalized = (status ?? 'UNKNOWN').toUpperCase();
  return STATUS_LABELS[normalized] ?? normalized;
}

export function translateService(name: string): string {
  return SERVICE_LABELS[name] ?? name;
}

export function translateConnectionAction(action: string): string {
  return CONNECTION_ACTION_LABELS[action] ?? action;
}

export function translateJobAction(action: string): string {
  return JOB_ACTION_LABELS[action] ?? action;
}

export function yesNo(value: boolean): string {
  return value ? 'Да' : 'Нет';
}

export function flagOnOff(value: boolean): string {
  return value ? 'Вкл' : 'Выкл';
}
