const FORBIDDEN_MARKETPLACE_HOSTS = [
  'https://www.ozon.ru',
  'https://ozon.ru',
  'https://xapi.ozon.ru',
  'https://www.wildberries.ru',
  'https://wildberries.ru',
  'https://card.wb.ru',
];

const WB_BASKET_HOST_PATTERN = /^https:\/\/basket-[\w-]+\.wbbasket\.ru/i;

export class ForbiddenMarketplaceDirectRequestError extends Error {
  constructor(url: string) {
    super(
      `Прямой запрос к маркетплейсу с frontend запрещён: ${url}. Используйте только backend API.`,
    );
    this.name = 'ForbiddenMarketplaceDirectRequestError';
  }
}

/** Блокирует direct frontend requests к Ozon/WB */
export function assertNotMarketplaceDirectRequest(url: string): void {
  const normalized = url.trim().toLowerCase();
  for (const host of FORBIDDEN_MARKETPLACE_HOSTS) {
    if (normalized.startsWith(host)) {
      throw new ForbiddenMarketplaceDirectRequestError(url);
    }
  }
  if (WB_BASKET_HOST_PATTERN.test(normalized)) {
    throw new ForbiddenMarketplaceDirectRequestError(url);
  }
}

/** @deprecated используйте assertNotMarketplaceDirectRequest */
export function assertNotOzonDirectRequest(url: string): void {
  assertNotMarketplaceDirectRequest(url);
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
