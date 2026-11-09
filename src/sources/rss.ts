/**
 * Factory for plain publisher RSS/Atom feeds (no scores; ranked by recency).
 */
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Lean, Source } from '../lib/types';

export function parseRss(xml: string, sourceId: string): Item[] {
  return parseFeed(xml).map((e) => ({
    id: e.id || e.link,
    title: e.title,
    url: e.link,
    publishedAt: toIso(e.published ?? e.updated) ?? '',
    source: sourceId,
  }));
}

export interface RssSourceOptions {
  id: string;
  name: string;
  code: string;
  about: string;
  homepage: string;
  feedUrl: string;
  /** Drop items whose URL matches, e.g. a publisher's sponsored section. */
  excludeUrl?: RegExp;
  publisher?: string;
  lean?: Lean;
}

export function rssSource({ id, name, code, about, homepage, feedUrl, excludeUrl, publisher, lean }: RssSourceOptions): Source {
  return {
    id,
    name,
    code,
    about,
    homepage,
    hasScore: false,
    publisher,
    lean,
    sortDescription: `Newest first, as listed in ${name}'s RSS feed.`,
    fetch: async () => {
      const items = parseRss(await getText(feedUrl, 'application/rss+xml, application/atom+xml, application/xml'), id);
      return excludeUrl ? items.filter((item) => !excludeUrl.test(item.url)) : items;
    },
  };
}
