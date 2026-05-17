import { describe, it, expect } from 'vitest';
import { buildQuotePayload } from '@/app/_quote-form.utils';

describe('buildQuotePayload', () => {
  it('includes only name + email when optionals are blank', () => {
    const payload = buildQuotePayload({
      name: 'Jane', company: '', email: 'jane@ex.com',
      item_type: '', weight_lbs: '', origin_zip: '',
    });
    expect(payload).toEqual({ name: 'Jane', email: 'jane@ex.com' });
  });

  it('parses weight_lbs as int, skips on NaN', () => {
    const a = buildQuotePayload({ name: 'A', company: '', email: 'a@b.c', item_type: '', weight_lbs: '60', origin_zip: '' });
    expect(a.weight_lbs).toBe(60);
    const b = buildQuotePayload({ name: 'A', company: '', email: 'a@b.c', item_type: '', weight_lbs: 'abc', origin_zip: '' });
    expect(b.weight_lbs).toBeUndefined();
  });
});
