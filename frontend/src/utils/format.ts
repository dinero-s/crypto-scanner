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

export function getHumanError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Произошла неизвестная ошибка';
}

export function mapUserStatus(user: {
  isBlocked?: boolean;
  isDisabled?: boolean;
}): string {
  if (user.isBlocked) return 'BLOCKED';
  if (user.isDisabled) return 'DISABLED';
  return 'ACTIVE';
}
