/**
 * Product Hunt — Atom feed of featured products.
 * Endpoint: https://www.producthunt.com/feed — no key, no vote counts.
 * `published` is the product's creation date, so we use `updated` (when it was
 * featured) for recency.
 */
import { decodeEntities, stripTags } from '../lib/entities';
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export function parse(xml: string): Item[] {
  return parseFeed(xml).map((e) => {
    const tagline = decodeEntities(stripTags(e.content?.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? ''));
    return {
      id: e.id ?? e.link,
      title: tagline ? `${e.title} — ${tagline}` : e.title,
      url: e.link,
      discussionUrl: e.link,
      publishedAt: toIso(e.updated ?? e.published) ?? '',
      source: 'producthunt',
    };
  });
}

const source: Source = {
  id: 'producthunt',
  name: 'Product Hunt',
  homepage: 'https://www.producthunt.com/',
  hasScore: false,
  sortDescription: "Product Hunt's featured products in the order of its public feed. Vote counts aren't available in the feed.",
  fetch: async () => parse(await getText('https://www.producthunt.com/feed')),
};
export default source;
