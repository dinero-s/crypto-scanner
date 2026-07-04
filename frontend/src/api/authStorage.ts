const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const EMAIL_KEY = 'userEmail';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUserEmail(): string | null {
  return sessionStorage.getItem(EMAIL_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string, email?: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }
  if (email) {
    sessionStorage.setItem(EMAIL_KEY, email);
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
