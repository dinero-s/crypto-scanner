/** Русские подписи для админ-панели */

export const ADMIN_NAV = [
  { to: '/admin/users', label: 'Пользователи', icon: '👥' },
  { to: '/admin/audit', label: 'Журнал аудита', icon: '📋' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  OK: 'В норме',
  ACTIVE: 'Активен',
  BLOCKED: 'Заблокирован',
  DISABLED: 'Отключён',
  FAILED: 'Ошибка',
  ERROR: 'Ошибка',
  UNKNOWN: 'Неизвестно',
};

export function translateStatus(status?: string): string {
  const normalized = (status ?? 'UNKNOWN').toUpperCase();
  return STATUS_LABELS[normalized] ?? normalized;
}

export function yesNo(value: boolean): string {
  return value ? 'Да' : 'Нет';
}
