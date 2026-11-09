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

describe('scoring signals', () => {
  const story = (source: string, title: string, age = 1, path = title): Item => ({
    id: `${source}-${path}`, source, title, url: `https://${source}.example/${encodeURIComponent(path)}`, publishedAt: hoursAgo(age),
  });
  const SAME = 'Senate passes spending bill to avert shutdown';
  const SOLO = 'Completely unrelated solitary headline about gardening tools today';

  it('gives time-ordered feeds one baseline, so feed position does not matter', () => {
    const items = [story('rss', 'First story in feed', 1), story('rss', 'Second story in feed', 1)];
    const out = buildTrending([{ hasScore: false, items }], 10, NOW);
    expect(out[0].heat).toBeCloseTo(out[1].heat);
  });

  it('keeps position for popularity-ordered feeds', () => {
    const items = Array.from({ length: 10 }, (_, i) => story('reddit', `Post number ${i} words`, 1));
    const out = buildTrending([{ hasScore: false, rankedFeed: true, items }], 10, NOW);
    expect(out[0].item.title).toBe('Post number 0 words');
    expect(out[0].heat).toBeGreaterThan(out[9].heat);
  });

  it('counts the top of a short list for less than the top of a full one', () => {
    const list = (source: string, n: number) => Array.from({ length: n }, (_, i) => ({ ...story(source, `${source} item ${i}`, 1), score: 100 - i }));
    const out = buildTrending([{ hasScore: true, items: list('short', 2) }, { hasScore: true, items: list('full', 20) }], 40, NOW);
    expect(out[0].item.source).toBe('full');
  });

  it('counts feeds from one publisher once', () => {
    const shared = 'https://espn.example/shared';
    const a = { ...story('nfl', SAME), url: shared };
    const b = { ...story('espn', SAME), url: shared };
    const one = buildTrending([{ hasScore: false, publisher: 'espn', items: [a] }, { hasScore: false, publisher: 'espn', items: [b] }], 5, NOW);
    const two = buildTrending([{ hasScore: false, items: [a] }, { hasScore: false, items: [b] }], 5, NOW);
    expect(one[0].appearances).toHaveLength(2);
    expect(two[0].heat / one[0].heat).toBeCloseTo(1.5);
  });

  it('counts a social source for less, whichever source leads', () => {
    const news = story('bbc', SAME);
    const social = { ...story('bsky', SAME), url: news.url };
    const out = buildTrending([{ hasScore: false, items: [news] }, { hasScore: false, social: true, items: [social] }], 5, NOW);
    const alone = buildTrending([{ hasScore: false, items: [news] }], 5, NOW);
    expect(out[0].heat / alone[0].heat).toBeCloseTo(1.2);
  });

  it('boosts and labels stories covered by left and right', () => {
    const l = story('left', SAME);
    const r = { ...story('right', SAME), url: l.url };
    const mixed = buildTrending([{ hasScore: false, lean: 'left', items: [l] }, { hasScore: false, lean: 'right', items: [r] }], 5, NOW);
    const same = buildTrending([{ hasScore: false, lean: 'left', items: [l] }, { hasScore: false, lean: 'left', items: [r] }], 5, NOW);
    expect(mixed[0].spectrum).toBe('both');
    expect(same[0].spectrum).toBe('left');
    expect(mixed[0].heat / same[0].heat).toBeCloseTo(1.25);
  });

  it('does not call a single outlet one-sided', () => {
    expect(buildTrending([{ hasScore: false, lean: 'right', items: [story('r', SOLO)] }], 5, NOW)[0].spectrum).toBeUndefined();
  });

  it('caps solo stories per publisher in each block of ranks', () => {
    const flood = Array.from({ length: 12 }, (_, i) => ({ ...story('flood', `Flood story ${i}`, 1), score: 100 - i }));
    const others = Array.from({ length: 12 }, (_, i) => story(`other${i}`, `Other story ${i}`, 20));
    const out = buildTrending([{ hasScore: true, items: flood }, ...others.map((o) => ({ hasScore: false, items: [o] }))], 10, NOW);
    expect(out.filter((s) => s.item.source === 'flood')).toHaveLength(3);
  });

  it('never caps stories several publishers cover', () => {
    const titles = ['Alpha merger talks collapse amid regulator concerns', 'Beta rocket launch delayed after engine fault found', 'Gamma vaccine trial results exceed researcher expectations', 'Delta strike ends after union accepts final offer'];
    const a = titles.map((t) => story('a', t));
    const b = titles.map((t) => ({ ...story('b', t), url: story('a', t).url }));
    expect(buildTrending([{ hasScore: false, items: a }, { hasScore: false, items: b }], 10, NOW)).toHaveLength(4);
  });

  it('explains placement', () => {
    const a = story('a', SAME);
    const b = { ...story('b', SAME), url: a.url };
    const out = buildTrending([{ hasScore: false, name: 'NPR', items: [a] }, { hasScore: false, name: 'BBC', items: [b] }], 5, NOW);
    expect(out[0].why).toContain('Covered by');
    expect(out[0].why).toContain('NPR');
    expect(out[0].why).toContain('BBC');
  });

  it('names the source a rank comes from', () => {
    const a = { ...story('hn', SAME), score: 10 };
    const b = { ...story('bbc', SAME), url: a.url };
    const out = buildTrending([{ hasScore: true, name: 'Hacker News', items: [a] }, { hasScore: false, name: 'BBC', items: [b] }], 5, NOW);
    expect(out[0].why).toContain('Ranked #1 of 1 on Hacker News.');
  });
});
