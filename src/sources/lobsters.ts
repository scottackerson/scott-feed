/**
 * Lobsters — hottest stories as JSON.
 * Endpoint: https://lobste.rs/hottest.json — free, no key.
 */
import { getJson } from '../lib/http';
import type { Item, Source } from '../lib/types';

interface Story {
  short_id: string;
  title: string;
  url?: string;
  score: number;
  comment_count: number;
  created_at: string;
  comments_url: string;
}

export function parse(data: Story[]): Item[] {
  return (Array.isArray(data) ? data : []).map((s) => ({
    id: s.short_id,
    title: s.title,
    url: s.url || s.comments_url,
    discussionUrl: s.comments_url,
    score: s.score,
    comments: s.comment_count,
    publishedAt: s.created_at,
    source: 'lobsters',
  }));
}

const source: Source = {
  id: 'lobsters',
  name: 'Lobsters',
  code: 'LOB',
  about:
    "Lobsters is an invite-only, community-run link aggregator focused on computing, started in 2012. Every story is tagged by topic, and its moderation log is public.",
  homepage: 'https://lobste.rs/',
  hasScore: true,
  scoreLabel: 'pts',
  sortDescription: "Same order as Lobsters' \"hottest\" page, which balances votes, comments and age.",
  fetch: async () => parse(await getJson('https://lobste.rs/hottest.json')),
};
export default source;
