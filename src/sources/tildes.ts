/**
 * Tildes ~tech — topics from Tildes' technology group.
 * Endpoint: https://tildes.net/~tech/topics.atom — public Atom, no key.
 * Entries link to the submitted URL; vote and comment counts and the
 * comments URL are listed in the entry content.
 */
import { decodeEntities } from '../lib/entities';
import { parseFeed, toIso } from '../lib/feed';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

const num = (s: string | undefined) => (s ? Number(s.replace(/,/g, '')) : undefined);

export function parse(xml: string): Item[] {
  return parseFeed(xml).map((e) => {
    const c = e.content ?? '';
    const comments = c.match(/Comments URL:\s*<a href="([^"]+)"/)?.[1];
    return {
      id: e.id ?? e.link,
      title: e.title,
      url: e.link,
      discussionUrl: comments ? decodeEntities(comments) : e.id,
      score: num(c.match(/Votes:\s*([\d,]+)/)?.[1]),
      comments: num(c.match(/Comments:\s*([\d,]+)/)?.[1]),
      publishedAt: toIso(e.published ?? e.updated) ?? '',
      source: 'tildes',
    };
  });
}

const source: Source = {
  id: 'tildes',
  name: 'Tildes ~tech',
  code: 'TILDES',
  about:
    'Tildes is a small, non-profit discussion community with no ads, known for thoughtful conversation. ~tech is its technology group.',
  homepage: 'https://tildes.net/~tech',
  hasScore: true,
  scoreLabel: 'votes',
  sortDescription: "Same order as Tildes' ~tech feed, newest topics first.",
  fetch: async () => parse(await getText('https://tildes.net/~tech/topics.atom')),
};
export default source;
