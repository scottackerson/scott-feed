import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '../src/lib/normalize-url';
import { buildTrending, sameHeadline, titleWords } from '../src/lib/trending';
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

describe('headline matching', () => {
  const story = (source: string, title: string, age = 1, path = source): Item => ({
    id: `${source}-${path}`, source, title, url: `https://${source}.example/${path}`, publishedAt: hoursAgo(age),
  });
  const same = (a: string, b: string) => sameHeadline(titleWords(a), titleWords(b));
  const run = (...items: Item[]) =>
    buildTrending(items.map((i) => ({ hasScore: false, items: [i] })), 10, NOW);

  it('matches rewordings of one headline, ignoring case, plurals and filler words', () => {
    expect(same('Senate passes spending bill to avert shutdown', "Senate Passes Spending Bill, Averts Government Shutdowns")).toBe(true);
  });

  it('does not match headlines that merely share a topic', () => {
    expect(same('Senate passes spending bill', 'Senate rejects spending bill amendment on defense')).toBe(false);
    expect(same('Apple earnings beat forecasts', 'Apple earnings miss forecasts as iPhone sales fall sharply in China')).toBe(false);
  });

  it('merges matching headlines from different outlets and lists both', () => {
    const out = run(story('npr', 'Senate passes spending bill to avert shutdown'), story('bbc', 'Senate passes spending bill, averts shutdown'));
    expect(out).toHaveLength(1);
    expect(out[0].appearances.map((a) => a.source).sort()).toEqual(['bbc', 'npr']);
  });

  it('keeps two articles from one outlet apart', () => {
    const out = run(
      story('npr', 'Senate passes spending bill to avert shutdown', 1, 'a'),
      story('npr', 'Senate passes spending bill to avert shutdown again', 2, 'b'),
    );
    expect(out).toHaveLength(2);
  });

  it('keeps similar headlines apart when published days apart', () => {
    const out = run(story('npr', 'Senate passes spending bill to avert shutdown', 1), story('bbc', 'Senate passes spending bill to avert shutdown', 100));
    expect(out).toHaveLength(2);
  });
});
