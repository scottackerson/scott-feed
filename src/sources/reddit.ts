/**
 * Reddit — "hot" posts from subreddit Atom feeds.
 * Endpoint: https://www.reddit.com/r/<subs>/.rss — no key.
 * The JSON API rejects most unauthenticated server traffic (403), so we use
 * RSS, which has no scores. Reddit may still block datacenter IPs; the card
 * then degrades gracefully.
 *
 * `redditSource()` builds one card from one or more subreddits; the cards
 * themselves are defined at the bottom of this file.
 */
import { decodeEntities } from '../lib/entities';
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export function parse(xml: string, sourceId = 'reddit'): Item[] {
  return parseFeed(xml).map((e) => {
    // Content contains `<a href="…">[link]</a>` pointing at the submitted URL.
    const link = e.content?.match(/<a href="([^"]+)">\s*\[link\]\s*<\/a>/)?.[1];
    return {
      id: e.id ?? e.link,
      title: e.title,
      url: link ? decodeEntities(link) : e.link,
      discussionUrl: e.link,
      publishedAt: toIso(e.published ?? e.updated) ?? '',
      source: sourceId,
    };
  });
}

const list = (subs: string[]) => subs.map((s) => `r/${s}`).join(', ').replace(/, ([^,]*)$/, ' and $1');

interface RedditOptions {
  id: string;
  name: string;
  code: string;
  /** Sentence(s) after the generic "Reddit is…" intro. */
  aboutCard: string;
  subreddits: string[];
}

export function redditSource({ id, name, code, aboutCard, subreddits }: RedditOptions): Source {
  const path = `r/${subreddits.join('+')}`;
  return {
    id,
    name,
    code,
    about: `Reddit is a large network of topic-based communities (subreddits) where members post links and discussions and vote them up or down. ${aboutCard}`,
    homepage: `https://www.reddit.com/${path}/`,
    hasScore: false,
    sortDescription:
      subreddits.length > 1
        ? `Reddit's "hot" order across ${list(subreddits)} combined. Vote counts aren't available in Reddit's feed.`
        : `Reddit's "hot" order for ${list(subreddits)}. Vote counts aren't available in Reddit's feed.`,
    fetch: async () => parse(await getText(`https://www.reddit.com/${path}/.rss?limit=50`), id),
  };
}

const reddit = redditSource({
  id: 'reddit',
  name: 'Reddit',
  code: 'RDT',
  aboutCard: 'This card combines r/programming, r/technology, r/webdev and r/MachineLearning.',
  subreddits: ['programming', 'technology', 'webdev', 'MachineLearning'],
});

export const localllama = redditSource({
  id: 'localllama',
  name: 'r/LocalLLaMA',
  code: 'LLAMA',
  aboutCard:
    'r/LocalLLaMA is its busiest community for running AI language models on your own hardware: new open models, tools, benchmarks and tips.',
  subreddits: ['LocalLLaMA'],
});

export default reddit;
