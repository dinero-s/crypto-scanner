const ADMIN_TOKEN_KEY = 'adminAccessToken';
const ADMIN_REFRESH_KEY = 'adminRefreshToken';
const ADMIN_EMAIL_KEY = 'adminEmail';
const ADMIN_ROLE_KEY = 'adminRole';

export function setAdminTokens(payload: {
  token: string;
  refresh_token: string;
  email: string;
  role: string;
}): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
  sessionStorage.setItem(ADMIN_REFRESH_KEY, payload.refresh_token);
  sessionStorage.setItem(ADMIN_EMAIL_KEY, payload.email);
  sessionStorage.setItem(ADMIN_ROLE_KEY, payload.role);
}

export function clearAdminTokens(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_REFRESH_KEY);
  sessionStorage.removeItem(ADMIN_EMAIL_KEY);
  sessionStorage.removeItem(ADMIN_ROLE_KEY);
}

export function getAdminAccessToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminAccessToken());
}

export function getAdminEmail(): string | null {
  return sessionStorage.getItem(ADMIN_EMAIL_KEY);
}

export function getAdminRole(): string | null {
  return sessionStorage.getItem(ADMIN_ROLE_KEY);
}
