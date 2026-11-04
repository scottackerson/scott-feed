/**
 * Reddit — "hot" posts from a multi-subreddit Atom feed.
 * Endpoint: https://www.reddit.com/r/<subs>/.rss — no key.
 * The JSON API rejects most unauthenticated server traffic (403), so we use
 * RSS, which has no scores. Reddit may still block datacenter IPs; the card
 * then degrades gracefully. Edit SUBREDDITS to change the mix.
 */
import { decodeEntities } from '../lib/entities';
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export const SUBREDDITS = ['programming', 'technology', 'webdev', 'MachineLearning'];

export function parse(xml: string): Item[] {
  return parseFeed(xml).map((e) => {
    // Content contains `<a href="…">[link]</a>` pointing at the submitted URL.
    const link = e.content?.match(/<a href="([^"]+)">\s*\[link\]\s*<\/a>/)?.[1];
    return {
      id: e.id ?? e.link,
      title: e.title,
      url: link ? decodeEntities(link) : e.link,
      discussionUrl: e.link,
      publishedAt: toIso(e.published ?? e.updated) ?? '',
      source: 'reddit',
    };
  });
}

const source: Source = {
  id: 'reddit',
  name: 'Reddit',
  homepage: `https://www.reddit.com/r/${SUBREDDITS.join('+')}/`,
  hasScore: false,
  sortDescription: "Reddit's \"hot\" order across r/programming, r/technology, r/webdev and r/MachineLearning combined. Vote counts aren't available in Reddit's feed.",
  fetch: async () => parse(await getText(`https://www.reddit.com/r/${SUBREDDITS.join('+')}/.rss?limit=50`)),
};
export default source;
