/**
 * Bluesky — link posts from a curated public tech feed.
 * Endpoint: https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed — no auth.
 * FEED_URI is "Tech by Flipboard". Only posts with an external link embed
 * are kept, so each item is an article.
 */
import { getJson } from '../lib/http';
import { stripTracking } from '../lib/normalize-url';
import type { Item, Source } from '../lib/types';

export const FEED_URI = 'at://did:plc:cndfx4udwgvpjaakvxvh7wm5/app.bsky.feed.generator/flipboard-tech';

interface FeedView {
  feed?: {
    post: {
      uri: string;
      author: { handle: string };
      record: { createdAt?: string };
      embed?: { external?: { uri: string; title: string } };
      likeCount?: number;
      repostCount?: number;
      replyCount?: number;
      indexedAt: string;
    };
  }[];
}

export function parse(data: FeedView): Item[] {
  const items: Item[] = [];
  for (const { post } of data.feed ?? []) {
    const ext = post.embed?.external;
    if (!ext?.uri || !ext.title) continue;
    const rkey = post.uri.split('/').pop();
    items.push({
      id: post.uri,
      title: ext.title,
      url: stripTracking(ext.uri),
      discussionUrl: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
      score: (post.likeCount ?? 0) + (post.repostCount ?? 0),
      comments: post.replyCount ?? 0,
      publishedAt: post.record.createdAt ?? post.indexedAt,
      source: 'bluesky',
    });
  }
  return items;
}

const source: Source = {
  id: 'bluesky',
  name: 'Bluesky',
  code: 'BSKY',
  about:
    "Bluesky is a decentralized social network built on the AT Protocol. This card reads \"Tech by Flipboard\", a public Bluesky feed of tech news links.",
  homepage: 'https://bsky.app/profile/did:plc:cndfx4udwgvpjaakvxvh7wm5/feed/flipboard-tech',
  hasScore: true,
  scoreLabel: 'likes+reposts',
  sortDescription: "Order chosen by the \"Tech by Flipboard\" Bluesky feed, usually newest first. Only posts that link to an article are shown.",
  // Feed is broad and fast-moving; scores are small. Keep it from flooding Trending.
  trendingWeight: 0.4,
  fetch: async () =>
    parse(
      await getJson(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${encodeURIComponent(FEED_URI)}&limit=50`,
      ),
    ),
};
export default source;
