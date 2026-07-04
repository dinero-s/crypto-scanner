import { describe, expect, it } from 'vitest';
import {
  assertNotMarketplaceDirectRequest,
  ForbiddenMarketplaceDirectRequestError,
} from '../api/marketplaceGuard';
import { maskSecret } from '../utils/secrets';

describe('admin security helpers', () => {
  it('blocks direct Ozon requests', () => {
    expect(() => assertNotMarketplaceDirectRequest('https://xapi.ozon.ru/foo')).toThrow(
      ForbiddenMarketplaceDirectRequestError,
    );
  });

  it('blocks direct Wildberries requests', () => {
    expect(() => assertNotMarketplaceDirectRequest('https://www.wildberries.ru/api')).toThrow(
      ForbiddenMarketplaceDirectRequestError,
    );
  });

  it('allows backend admin API paths', () => {
    expect(() => assertNotMarketplaceDirectRequest('/api/admin/overview')).not.toThrow();
  });

  it('masks secrets in UI helpers', () => {
    expect(maskSecret('1234567890')).not.toBe('1234567890');
  });
});

describe('admin job action visibility', () => {
  it('retry only for FAILED', () => {
    const showRetry = (status: string) => status === 'FAILED';
    const showCancel = (status: string) => status === 'WAITING' || status === 'DELAYED';
    expect(showRetry('FAILED')).toBe(true);
    expect(showRetry('COMPLETED')).toBe(false);
    expect(showCancel('WAITING')).toBe(true);
    expect(showCancel('ACTIVE')).toBe(false);
  });
});
