import { describe, expect, it } from 'vitest';
import { maskSecret } from '../utils/secrets';

describe('admin helpers', () => {
  it('masks secrets in UI helpers', () => {
    expect(maskSecret('1234567890')).not.toBe('1234567890');
  });
});
