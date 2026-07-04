export {
  ApiError,
  assertNotMarketplaceDirectRequest,
  ForbiddenMarketplaceDirectRequestError,
} from '../marketplaceGuard';

export class ForbiddenFrontendOzonRequestError extends Error {
  constructor(url: string) {
    super(
      `Запрос к Ozon с frontend запрещён: ${url}. Используйте только /api/user/ozon/*`,
    );
    this.name = 'ForbiddenFrontendOzonRequestError';
  }
}

const OZON_FORBIDDEN_HOSTS = [
  'https://www.ozon.ru',
  'https://ozon.ru',
  'https://xapi.ozon.ru',
];

/** Блокирует direct Ozon requests с frontend */
export function assertNotOzonDirectRequest(url: string): void {
  const normalized = url.trim().toLowerCase();
  for (const host of OZON_FORBIDDEN_HOSTS) {
    if (normalized.startsWith(host)) {
      throw new ForbiddenFrontendOzonRequestError(url);
    }
  }
}
