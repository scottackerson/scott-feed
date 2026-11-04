/**
 * Hacker News — via the Algolia HN Search API.
 * Endpoint: https://hn.algolia.com/api/v1/search?tags=front_page
 * Docs: https://hn.algolia.com/api — free, no key. Be gentle; we cache 10 min.
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

export function parse(data: { hits?: Hit[] }): Item[] {
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
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

const source: Source = {
  id: 'hn',
  name: 'Hacker News',
  homepage: 'https://news.ycombinator.com/',
  hasScore: true,
  scoreLabel: 'points',
  fetch: async () => parse(await getJson('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=50')),
};
export default source;
