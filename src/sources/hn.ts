/**
 * Hacker News — front-page stories from the Algolia HN Search API, put in
 * HN's real ranking order using the official Firebase API.
 *
 * Endpoints (both free, no key; we cache 10 min):
 * - https://hn.algolia.com/api/v1/search?tags=front_page — story details
 * - https://hacker-news.firebaseio.com/v0/topstories.json — story IDs in rank order
 *
 * If the ranking request fails, stories fall back to points order rather than
 * failing the whole card.
 *
 * Optional "momentum" order (`sort.hn=momentum`): stories from the last 24h
 * via Algolia's search, ranked by points per hour since posting.
 */
import { getJson } from '../lib/http';
import type { Item, Source, SortMode } from '../lib/types';

interface Hit {
  objectID: string;
  title?: string;
  url?: string | null;
  points?: number;
  num_comments?: number;
  created_at: string;
  created_at_i?: number;
}

/** Momentum only looks at stories this recent. */
export const MOMENTUM_LOOKBACK_HOURS = 24;
/** ...with at least this many points, so a 5-minute-old story with 3 votes can't top it. */
export const MOMENTUM_MIN_POINTS = 10;
/** Added to a story's age so very new stories don't get huge rates. */
const MOMENTUM_AGE_OFFSET_HOURS = 1;

/** Points per hour since posting, smoothed. */
export function momentumOf(points: number, publishedAt: string, now = Date.now()): number {
  const hours = Math.max(0, (now - Date.parse(publishedAt)) / 3_600_000);
  return points / (hours + MOMENTUM_AGE_OFFSET_HOURS);
}

/**
 * Parse Algolia hits. With `rankedIds` (from topstories.json), items follow
 * HN's front-page order; anything not in the list goes last by points.
 */
export function parse(data: { hits?: Hit[] }, rankedIds?: number[]): Item[] {
  const rank = new Map((rankedIds ?? []).map((id, i) => [String(id), i]));
  const position = (i: Item) => rank.get(i.id) ?? Number.POSITIVE_INFINITY;
  return (data.hits ?? [])
    .map((h): Item => {
      const discussionUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        id: h.objectID,
        title: h.title ?? '',
        url: h.url || discussionUrl,
        discussionUrl,
        score: h.points ?? 0,
        comments: h.num_comments ?? 0,
        publishedAt: h.created_at,
        source: 'hn',
      };
    })
    .sort((a, b) => position(a) - position(b) || (b.score ?? 0) - (a.score ?? 0));
}

/** Parse Algolia hits and rank them by momentum (fastest-climbing first). */
export function parseMomentum(data: { hits?: Hit[] }, now = Date.now()): Item[] {
  return parse(data)
    .map((item) => ({ item, m: momentumOf(item.score ?? 0, item.publishedAt, now) }))
    .sort((a, b) => b.m - a.m)
    .map(({ item }) => item);
}

const momentum: SortMode = {
  id: 'momentum',
  label: 'Momentum',
  sortDescription: `Momentum: stories posted in the last ${MOMENTUM_LOOKBACK_HOURS} hours with at least ${MOMENTUM_MIN_POINTS} points, fastest-climbing first. Each story is ranked by points per hour since it was posted (points ÷ (hours + ${MOMENTUM_AGE_OFFSET_HOURS})), so a story gaining votes quickly beats an older one with more points. Unlike the front page, there's no moderation or flag penalty.`,
  fetch: async () => {
    const since = Math.floor(Date.now() / 1000) - MOMENTUM_LOOKBACK_HOURS * 3600;
    const filters = encodeURIComponent(`created_at_i>${since},points>=${MOMENTUM_MIN_POINTS}`);
    return parseMomentum(
      await getJson<{ hits?: Hit[] }>(
        `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=${filters}&hitsPerPage=300`,
      ),
    );
  },
};

const source: Source = {
  id: 'hn',
  name: 'Hacker News',
  code: 'HN',
  about:
    "Hacker News is a social news site run by the startup accelerator Y Combinator since 2007. Members submit and upvote links about programming, startups and technology, and its comment threads are a big part of the draw.",
  homepage: 'https://news.ycombinator.com/',
  hasScore: true,
  scoreLabel: 'pts',
  sortDescription:
    "Same order as the Hacker News front page, which balances points against age. Falls back to most points first if HN's ranking can't be fetched.",
  fetch: async () => {
    const [hits, ranked] = await Promise.all([
      getJson<{ hits?: Hit[] }>('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=50'),
      getJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json').catch(() => undefined),
    ]);
    return parse(hits, Array.isArray(ranked) ? ranked : undefined);
  },
  sorts: { default: { id: 'front', label: 'Front page' }, others: [momentum] },
};
export default source;
