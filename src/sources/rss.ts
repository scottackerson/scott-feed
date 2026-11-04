/**
 * Factory for plain publisher RSS/Atom feeds (no scores; ranked by recency).
 */
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export function parseRss(xml: string, sourceId: string): Item[] {
  return parseFeed(xml).map((e) => ({
    id: e.id || e.link,
    title: e.title,
    url: e.link,
    publishedAt: toIso(e.published ?? e.updated) ?? '',
    source: sourceId,
  }));
}

export function rssSource(id: string, name: string, homepage: string, feedUrl: string): Source {
  return {
    id,
    name,
    homepage,
    hasScore: false,
    fetch: async () => parseRss(await getText(feedUrl, 'application/rss+xml, application/atom+xml, application/xml'), id),
  };
}
