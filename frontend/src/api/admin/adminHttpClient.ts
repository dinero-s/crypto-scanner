import { ApiError, assertNotMarketplaceDirectRequest } from '../marketplaceGuard';
import { clearAdminTokens, getAdminAccessToken } from './adminAuthStorage';

const ADMIN_API_BASE = '/api/admin';

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${ADMIN_API_BASE}${path}`;
  assertNotMarketplaceDirectRequest(url);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getAdminAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminTokens();
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      response.status === 401
        ? 'Требуется авторизация администратора.'
        : typeof body === 'object' &&
            body !== null &&
            'message' in body &&
            typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : `Ошибка запроса (${String(response.status)})`;
    throw new ApiError(message, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
