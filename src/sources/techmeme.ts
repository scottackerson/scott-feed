/**
 * Techmeme — editor-curated summary of the day's top tech stories.
 * Endpoint: https://www.techmeme.com/feed.xml — public RSS, no key.
 * Each item links to a Techmeme permalink; the original article's URL is the
 * bold headline link inside the description. We link the article and use
 * the Techmeme page as the "discussion" link (it gathers related coverage).
 */
import { decodeEntities } from '../lib/entities';
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export function parse(xml: string): Item[] {
  return parseFeed(xml).map((e) => {
    const article = e.content?.match(/<B>\s*<A HREF="([^"]+)"/i)?.[1];
    return {
      id: e.id ?? e.link,
      // Titles end with "(Author/Publication)"; the domain already shows the publication.
      title: e.title.replace(/\s*\([^()]*\)\s*$/, ''),
      url: article ? decodeEntities(article) : e.link,
      discussionUrl: e.link,
      publishedAt: toIso(e.published) ?? '',
      source: 'techmeme',
    };
  });
}

const source: Source = {
  id: 'techmeme',
  name: 'Techmeme',
  code: 'TM',
  about:
    "Techmeme is a tech news summary site run since 2005. Its editors, helped by software, pick the day's most important stories from across the web and group related coverage together.",
  homepage: 'https://www.techmeme.com/',
  hasScore: false,
  // Editorially chosen, so a stronger signal than a plain publisher feed.
  trendingWeight: 0.7,
  sortDescription:
    "Newest first, as listed in Techmeme's feed. Every story has already been picked by Techmeme's editors as one of the day's important ones. The comments link opens Techmeme's page with related coverage.",
  fetch: async () => parse(await getText('https://www.techmeme.com/feed.xml')),
};
export default source;
