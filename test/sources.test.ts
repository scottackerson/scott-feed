import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse as bluesky } from '../src/sources/bluesky';
import { parse as devto } from '../src/sources/devto';
import { parse as github } from '../src/sources/github';
import { parse as hfpapers } from '../src/sources/hfpapers';
import { parse as hn, momentumOf, parseMomentum } from '../src/sources/hn';
import { parse as lobsters } from '../src/sources/lobsters';
import { parse as mastodon } from '../src/sources/mastodon';
import { parse as producthunt } from '../src/sources/producthunt';
import { localllama, parse as reddit } from '../src/sources/reddit';
import { parse as techmeme } from '../src/sources/techmeme';
import { parse as tildes } from '../src/sources/tildes';
import { parseRss } from '../src/sources/rss';

const fx = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const json = (name: string) => JSON.parse(fx(name));

describe('source parsers', () => {
  it('hn: follows the front-page rank order when given', () => {
    // Story 3 isn't in the ranked list, so it goes last.
    expect(hn(json('hn.json'), [1, 2]).map((i) => i.id)).toEqual(['1', '2', '3']);
  });

  it('hn momentum: ranks by points per hour, not total points', () => {
    const now = Date.parse('2026-11-05T12:00:00Z');
    const hit = (id: string, points: number, hoursAgo: number) => ({
      objectID: id,
      title: id,
      url: `https://e.com/${id}`,
      points,
      num_comments: 0,
      created_at: new Date(now - hoursAgo * 3_600_000).toISOString(),
    });
    const items = parseMomentum({ hits: [hit('old', 600, 11), hit('fast', 200, 2), hit('slow', 30, 20)] }, now);
    expect(items.map((i) => i.id)).toEqual(['fast', 'old', 'slow']);
    expect(momentumOf(100, new Date(now).toISOString(), now)).toBe(100);
  });

  it('hn: falls back to points order, and to the HN link for Ask HN', () => {
    const items = hn(json('hn.json'));
    expect(items.map((i) => i.id)).toEqual(['2', '1', '3']);
    expect(items[0].url).toBe('https://news.ycombinator.com/item?id=2');
    expect(items[0]).toMatchObject({ score: 500, comments: 200, source: 'hn' });
  });

  it('lobsters', () => {
    const [i] = lobsters(json('lobsters.json'));
    expect(i).toMatchObject({ id: 'abc123', url: 'https://example.com/a', score: 32, comments: 3 });
    expect(i.discussionUrl).toContain('lobste.rs/s/abc123');
  });

  it('reddit: extracts the submitted link and comments URL', () => {
    const [i] = reddit(fx('reddit.rss'));
    expect(i.title).toBe('A post & more');
    expect(i.url).toBe('https://example.com/article?x=1&y=2');
    expect(i.discussionUrl).toBe('https://www.reddit.com/r/programming/comments/abc/a_post/');
    expect(i.publishedAt).toBe('2026-11-04T08:49:19.000Z');
  });

  it('github: parses repo, description and stars today', () => {
    const now = new Date('2026-11-04T12:00:00Z');
    const items = github(fx('github.html'), now);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 'acme/rocket',
      title: 'acme / rocket: A fast & tiny rocket.',
      url: 'https://github.com/acme/rocket',
      score: 2053,
      publishedAt: now.toISOString(),
    });
    expect(items[1].title).toBe('acme / no-desc');
  });

  it('producthunt: title + tagline, uses updated date', () => {
    const [i] = producthunt(fx('producthunt.xml'));
    expect(i.title).toBe('Widget — Widgets for everyone');
    expect(i.publishedAt).toBe('2026-11-04T15:13:17.000Z');
  });

  it('devto', () => {
    const [i] = devto(json('devto.json'));
    expect(i).toMatchObject({ id: '42', score: 65, comments: 35, discussionUrl: 'https://dev.to/someone/a-post#comments' });
  });

  it('bluesky: keeps only link posts, strips tracking', () => {
    const items = bluesky(json('bluesky.json'));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      url: 'https://example.com/story?id=7',
      score: 15,
      discussionUrl: 'https://bsky.app/profile/news.example.com/post/rkey1',
    });
  });

  it('mastodon: score is shares over the last two days', () => {
    expect(mastodon(json('mastodon.json'))[0].score).toBe(596);
  });

  it('rss: handles CDATA, tags and numeric entities', () => {
    const items = parseRss(fx('rss.xml'), 'pub');
    expect(items.map((i) => i.title)).toEqual(['Headline with tags & stuff', 'Second ’quoted’']);
    expect(items[0].publishedAt).toBe('2026-11-04T15:00:00.000Z');
  });

  it('atom: uses alternate link and published date', () => {
    const [i] = parseRss(fx('atom.xml'), 'pub');
    expect(i).toMatchObject({ title: 'Atom headline', url: 'https://atom.example.com/one', publishedAt: '2026-11-04T15:00:00.000Z' });
  });

  it('reddit: tags items with the given card id', () => {
    expect(reddit(fx('reddit.rss'), 'localllama')[0].source).toBe('localllama');
    expect(localllama.homepage).toBe('https://www.reddit.com/r/LocalLLaMA/');
    expect(localllama.sortDescription).toContain('r/LocalLLaMA');
  });

  it('techmeme: links the original article, strips the byline', () => {
    const [i] = techmeme(fx('techmeme.xml'));
    expect(i.title).toBe('Acme agrees to buy Widgetco for ~$2B in cash and stock');
    expect(i.url).toBe('https://news.example.com/acme-widgetco?x=1&y=2');
    expect(i.discussionUrl).toBe('https://www.techmeme.com/261104/p48#a261104p48');
    expect(i.publishedAt).toBe('2026-11-04T19:45:48.000Z');
  });

  it('hfpapers: most upvoted first, arXiv link, HF discussion', () => {
    const items = hfpapers(json('hfpapers.json'));
    expect(items.map((i) => i.id)).toEqual(['2611.00002', '2611.00001']);
    expect(items[0]).toMatchObject({
      title: 'A Popular Paper',
      url: 'https://arxiv.org/abs/2611.00002',
      discussionUrl: 'https://huggingface.co/papers/2611.00002',
      score: 40,
      comments: 3,
      publishedAt: '2026-11-04T00:00:00.000Z',
    });
  });

  it('tildes: submitted link, comments URL, votes and comments', () => {
    const [i] = tildes(fx('tildes.xml'));
    expect(i).toMatchObject({
      url: 'https://www.example.com/watch?v=abc',
      discussionUrl: 'https://tildes.net/~tech/1wry/a_tool',
      score: 12,
      comments: 3,
      publishedAt: '2026-11-04T19:31:51.000Z',
    });
  });
});
