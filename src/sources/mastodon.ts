/**
 * Mastodon — trending links on mastodon.social.
 * Endpoint: https://mastodon.social/api/v1/trends/links — public, no auth.
 * Score is the number of shares over the last two days of `history`.
 */
import { getJson } from '../lib/http';
import type { Item, Source } from '../lib/types';

interface Link {
  url: string;
  title: string;
  published_at?: string | null;
  history?: { day: string; uses: string }[];
}

export function parse(data: Link[]): Item[] {
  return (Array.isArray(data) ? data : []).map((l) => ({
    id: l.url,
    title: l.title,
    url: l.url,
    score: (l.history ?? []).slice(0, 2).reduce((s, h) => s + (Number(h.uses) || 0), 0),
    publishedAt: l.published_at ?? new Date().toISOString(),
    source: 'mastodon',
  }));
}

const source: Source = {
  id: 'mastodon',
  name: 'Mastodon',
  code: 'MSTDN',
  about:
    "Mastodon is a decentralized, open-source social network made up of independently run servers, part of the wider \"fediverse\". This card shows links trending on mastodon.social, its largest server.",
  homepage: 'https://mastodon.social/explore/links',
  hasScore: true,
  scoreLabel: 'shares',
  sortDescription: "mastodon.social's trending links, ranked by how widely each link is being shared across the fediverse. Not limited to tech.",
  // Fediverse trends skew toward general news, not just tech.
  trendingWeight: 0.4,
  fetch: async () => parse(await getJson('https://mastodon.social/api/v1/trends/links?limit=40')),
};
export default source;
