import { ApiError } from '../../api/errors';
import { API_BASE_URL } from '../config/env';
import { getTelegramToken, clearTelegramToken } from '../storage/telegramAuthStorage';

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, params?: Record<string, QueryValue | QueryValue[]>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, String(item));
      }
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

export async function miniAppFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, QueryValue | QueryValue[]> } = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers ?? {}),
  };

  const token = getTelegramToken();
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    if (response.status === 401) {
      clearTelegramToken();
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      typeof body === 'object' &&
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
