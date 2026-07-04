const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /client[_-]?id/i,
  /token/i,
  /authorization/i,
  /secret/i,
  /password/i,
  /encrypted/i,
];

export function maskSecret(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) return '••••';
  return `${value.slice(0, visibleChars)}${'•'.repeat(Math.min(8, value.length - visibleChars))}`;
}

export function sanitizeAuditValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  const str = String(value);
  if (SECRET_PATTERNS.some((p) => p.test(key))) {
    return maskSecret(str);
  }
  if (str.length > 64 && SECRET_PATTERNS.some((p) => p.test(str))) {
    return maskSecret(str);
  }
  return str;
}

export function containsSecrets(text: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(text));
}
