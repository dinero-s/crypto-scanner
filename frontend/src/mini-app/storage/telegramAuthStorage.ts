const TOKEN_KEY = 'mini-app:telegram-token';

export function getTelegramToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTelegramToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearTelegramToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
