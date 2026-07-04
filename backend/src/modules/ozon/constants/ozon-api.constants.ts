import { OzonApiType } from './ozon.enums';

/** Разрешённые официальные base URL Ozon API */
export const OZON_ALLOWED_BASE_URLS: Record<OzonApiType, string[]> = {
    [OzonApiType.SELLER]: ['https://api-seller.ozon.ru'],
    [OzonApiType.PERFORMANCE]: ['https://api-performance.ozon.ru'],
    [OzonApiType.STATISTICS]: ['https://api-seller.ozon.ru'],
};

/** Запрещённые домены (HTML/scraping/internal) */
export const OZON_FORBIDDEN_HOSTS = [
    'www.ozon.ru',
    'ozon.ru',
    'xapi.ozon.ru',
    'api.ozon.ru',
] as const;

/** Allowlist endpoint-путей по типу API */
export const OZON_ALLOWED_ENDPOINTS: Record<OzonApiType, string[]> = {
    [OzonApiType.SELLER]: [
        '/v1/roles',
        '/v3/product/list',
        '/v3/product/info/list',
        '/v4/product/info/stocks',
        '/v2/analytics/stock_on_warehouses',
        '/v3/posting/fbs/list',
        '/v3/posting/fbs/unfulfilled/list',
        '/v1/finance/cash-flow-statement/list',
        '/v1/report/products/create',
        '/v1/report/info',
        '/v1/analytics/data',
    ],
    [OzonApiType.PERFORMANCE]: [
        '/api/client/campaign',
        '/api/client/statistics',
        '/api/client/statistics/report',
        '/api/client/token',
    ],
    [OzonApiType.STATISTICS]: [
        '/v1/analytics/data',
        '/v2/analytics/stock_on_warehouses',
    ],
};

/** Системный промпт AI Advisor — только официальные данные */
export const OZON_AI_SYSTEM_PROMPT =
    'Используй только переданные официальные данные Ozon Seller API, Performance API и Statistics API. ' +
    'Если данных недостаточно, честно скажи, что данных недостаточно. ' +
    'Не предлагай использовать парсинг, обход лимитов, скрытые endpoint\'ы, CAPTCHA bypass или любые неофициальные методы сбора данных.';
