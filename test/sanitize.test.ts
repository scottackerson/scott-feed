import { describe, expect, it } from 'vitest';
import { sanitize } from '../src/lib/cache';
import type { Item } from '../src/lib/types';

const base: Item = { id: '1', title: 'ok', url: 'https://a.com', publishedAt: '2026-11-04T00:00:00Z', source: 'x' };

describe('sanitize', () => {
  it('drops non-http URLs, empty titles and duplicates', () => {
    const out = sanitize(
      [
        base,
        { ...base, id: '2', url: 'javascript:alert(1)' },
        { ...base, id: '3', title: '  ' },
        { ...base },
        { ...base, id: '4', discussionUrl: 'data:text/html,hi' },
      ],
      'x',
    );
    expect(out.map((i) => i.id)).toEqual(['1', '4']);
    expect(out[1].discussionUrl).toBeUndefined();
  });

  it('fills invalid dates and truncates long titles', () => {
    const [i] = sanitize([{ ...base, title: 'x'.repeat(400), publishedAt: 'nope' }], 'x');
    expect(i.title.length).toBe(300);
    expect(Number.isNaN(Date.parse(i.publishedAt))).toBe(false);
  });
});
