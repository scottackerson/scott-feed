import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '../src/lib/normalize-url';
import { buildTrending } from '../src/lib/trending';
import type { Item } from '../src/lib/types';

const NOW = Date.parse('2026-11-04T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const item = (source: string, id: string, url: string, score: number | undefined, age: number): Item => ({
  id, source, url, title: id, score, publishedAt: hoursAgo(age),
});

describe('normalizeUrl', () => {
  it('ignores protocol, www, tracking params, hash and trailing slash', () => {
    expect(normalizeUrl('https://www.Example.com/a/?utm_source=x&b=2&a=1#top')).toBe('example.com/a?a=1&b=2');
    expect(normalizeUrl('http://example.com/a?b=2&a=1')).toBe('example.com/a?a=1&b=2');
  });
});

describe('buildTrending', () => {
  it('dedupes by URL and lists every source', () => {
    const out = buildTrending(
      [
        { hasScore: true, items: [item('hn', 'h1', 'https://example.com/story', 500, 2)] },
        { hasScore: true, items: [item('lobsters', 'l1', 'https://www.example.com/story/?utm_medium=x', 40, 2)] },
      ],
      10,
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0].appearances.map((a) => a.source).sort()).toEqual(['hn', 'lobsters']);
  });

  it('boosts stories seen on multiple sources', () => {
    const shared = 'https://example.com/shared';
    const out = buildTrending(
      [
        { hasScore: true, items: [item('hn', 'solo', 'https://example.com/solo', 900, 1), item('hn', 's', shared, 100, 1)] },
        { hasScore: true, items: [item('lobsters', 's2', shared, 50, 1)] },
        { hasScore: true, items: [item('devto', 's3', shared, 10, 1)] },
      ],
      10,
      NOW,
    );
    expect(out[0].item.url).toBe(shared);
  });

  it('decays older items', () => {
    const out = buildTrending(
      [{ hasScore: false, items: [item('rss', 'old', 'https://a.com/old', undefined, 30), item('rss', 'new', 'https://a.com/new', undefined, 1)] }],
      10,
      NOW,
    );
    expect(out[0].item.id).toBe('new');
  });

  it('respects the limit', () => {
    const items = Array.from({ length: 30 }, (_, i) => item('hn', `i${i}`, `https://a.com/${i}`, i, 1));
    expect(buildTrending([{ hasScore: true, items }], 7, NOW)).toHaveLength(7);
  });
});

describe('undated sources', () => {
  it('scores undated items with an assumed age instead of "now"', () => {
    const out = buildTrending(
      [
        { hasScore: true, undated: true, items: [item('github', 'g', 'https://github.com/a/b', 2000, 0)] },
        { hasScore: true, items: [item('hn', 'h', 'https://example.com/h', 500, 1)] },
      ],
      10,
      NOW,
    );
    expect(out[0].item.id).toBe('h');
  });
});
