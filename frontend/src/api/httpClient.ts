import { ApiError, assertNotOzonDirectRequest } from './marketplaceGuard';
import { clearTokens, getAccessToken } from './authStorage';

const API_BASE = '/api/user/ozon';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  assertNotOzonDirectRequest(url);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      response.status === 401
        ? 'Требуется авторизация. Войдите в систему.'
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
