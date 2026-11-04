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
 */
import { getJson } from '../lib/http';
import type { Item, Source } from '../lib/types';

interface Hit {
  objectID: string;
  title?: string;
  url?: string | null;
  points?: number;
  num_comments?: number;
  created_at: string;
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

const source: Source = {
  id: 'hn',
  name: 'Hacker News',
  code: 'HN',
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
};
export default source;
