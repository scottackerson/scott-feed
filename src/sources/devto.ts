/**
 * dev.to — top articles of the last day.
 * Endpoint: https://dev.to/api/articles?top=1 — Forem API, free, no key.
 */
import { getJson } from '../lib/http';
import type { Item, Source } from '../lib/types';

interface Article {
  id: number;
  title: string;
  url: string;
  public_reactions_count: number;
  comments_count: number;
  published_at: string;
}

export function parse(data: Article[]): Item[] {
  return (Array.isArray(data) ? data : []).map((a) => ({
    id: String(a.id),
    title: a.title,
    url: a.url,
    discussionUrl: `${a.url}#comments`,
    score: a.public_reactions_count,
    comments: a.comments_count,
    publishedAt: a.published_at,
    source: 'devto',
  }));
}

const source: Source = {
  id: 'devto',
  name: 'dev.to',
  code: 'DEV',
  homepage: 'https://dev.to/top/day',
  hasScore: true,
  scoreLabel: 'reactions',
  sortDescription: "dev.to's \"top of the day\" ranking of articles from the last 24 hours.",
  // Every article is from the last day, so it would otherwise crowd Trending.
  trendingWeight: 0.6,
  fetch: async () => parse(await getJson('https://dev.to/api/articles?top=1&per_page=50')),
};
export default source;
