/**
 * GitHub Trending — scraped from https://github.com/trending (no official API).
 * Fragile by nature: if GitHub changes its markup, the fixture test will keep
 * passing but live data will be empty and the card shows "unavailable".
 */
import { decodeEntities, stripTags } from '../lib/entities';
import { getText } from '../lib/http';
import type { Item, Source } from '../lib/types';

export function parse(html: string, now = new Date()): Item[] {
  const rows = html.match(/<article class="Box-row">[\s\S]*?<\/article>/g) ?? [];
  const items: Item[] = [];
  for (const row of rows) {
    const h2 = row.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
    const path = h2.match(/href="\/([^"/]+\/[^"/]+)"/)?.[1];
    if (!path) continue;
    const desc = decodeEntities(stripTags(row.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/)?.[1] ?? ''));
    const today = row.match(/([\d,]+)\s+stars?\s+(today|this week|this month)/)?.[1];
    const repo = path.replace('/', ' / ');
    items.push({
      id: path,
      title: desc ? `${repo}: ${desc}` : repo,
      url: `https://github.com/${path}`,
      score: today ? Number(today.replace(/,/g, '')) : 0,
      // Trending has no publish date; treat as current.
      publishedAt: now.toISOString(),
      source: 'github',
    });
  }
  return items;
}

const source: Source = {
  id: 'github',
  name: 'GitHub Trending',
  code: 'GH',
  about:
    "GitHub Trending is GitHub's daily list of the open-source repositories getting the most attention, largely measured by new stars.",
  homepage: 'https://github.com/trending',
  hasScore: true,
  undated: true,
  scoreLabel: '★ today',
  sortDescription: "Same order as GitHub's Trending page for today. GitHub doesn't publish how it ranks, but stars gained today are a big factor.",
  fetch: async () => parse(await getText('https://github.com/trending')),
};
export default source;
