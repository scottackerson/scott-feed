import { TRENDING } from './config';
import { normalizeUrl } from './normalize-url';
import { ageHours } from './time';
import type { Item, TrendingItem } from './types';

export interface TrendingInput {
  items: Item[];
  hasScore: boolean;
  undated?: boolean;
  weight?: number;
}

/**
 * Percentile within a source, 1 = best, approaching 0 = worst.
 * Scored sources rank by score; unscored sources rank by native order
 * (which for RSS feeds is recency).
 */
function percentiles(input: TrendingInput): Map<Item, number> {
  const ranked = input.hasScore ? [...input.items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) : input.items;
  const len = ranked.length;
  return new Map(ranked.map((item, i) => [item, (len - i) / len]));
}

/** Compute a single item's heat (before the cross-source boost). */
export function heatOf(percentile: number, input: Omit<TrendingInput, 'items'>, publishedAt: string, now = Date.now()): number {
  const weight = input.weight ?? (input.hasScore ? 1 : TRENDING.unscoredWeight);
  const age = input.undated ? TRENDING.undatedAgeHours : ageHours(publishedAt, now);
  return (percentile * weight) / (1 + age / TRENDING.decayHours);
}

const STOP_WORDS = new Set(
  'a an and are as at be but by for from has have he her his how in is it its new of on or over says she that the their they this to was were what when who why will with after about into than'.split(
    ' ',
  ),
);

/** A headline's meaningful words, lowercased, with plurals folded together. */
export function titleWords(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/['\u2019]s\b/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !STOP_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
  return new Set(words);
}

/** Whether two headlines' word sets describe the same story. */
export function sameHeadline(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared >= TRENDING.titleMatchMinWords && shared / (a.size + b.size - shared) >= TRENDING.titleMatchSimilarity;
}

interface Appearance {
  heat: number;
  item: Item;
}

/**
 * Merge groups whose headlines match, for outlets that each publish the same
 * story at their own URL. Each group is compared only with a cluster's hottest
 * headline, so a chain of loosely related headlines can't snowball into one
 * entry. Groups sharing a source stay apart: one outlet's two articles are two
 * stories.
 */
function mergeByHeadline(groups: Appearance[][]): Appearance[][] {
  const best = (g: Appearance[]) => g.reduce((a, b) => (b.heat > a.heat ? b : a));
  const clusters: { words: Set<string>; time: number; sources: Set<string>; members: Appearance[] }[] = [];
  const byWord = new Map<string, number[]>();
  const maxApart = TRENDING.titleMatchMaxHoursApart * 3_600_000;

  for (const group of [...groups].sort((a, b) => best(b).heat - best(a).heat)) {
    const top = best(group).item;
    const words = titleWords(top.title);
    const time = Date.parse(top.publishedAt);
    const sources = new Set(group.map((e) => e.item.source));
    const candidates = new Set([...words].flatMap((w) => byWord.get(w) ?? []));
    const match = [...candidates]
      .sort((a, b) => a - b)
      .find((i) => {
        const c = clusters[i];
        return (
          Math.abs(c.time - time) <= maxApart &&
          ![...sources].some((s) => c.sources.has(s)) &&
          sameHeadline(c.words, words)
        );
      });
    if (match !== undefined) {
      clusters[match].members.push(...group);
      for (const s of sources) clusters[match].sources.add(s);
    } else {
      const index = clusters.push({ words, time, sources, members: [...group] }) - 1;
      for (const w of words) byWord.set(w, [...(byWord.get(w) ?? []), index]);
    }
  }
  return clusters.map((c) => c.members);
}

/**
 * Blend items from several sources into one ranked, de-duplicated list.
 * Stories sharing a normalized URL or a closely matching headline collapse
 * into one entry with every source listed, and are boosted per extra source.
 */
export function buildTrending(inputs: TrendingInput[], limit: number, now = Date.now()): TrendingItem[] {
  const groups = new Map<string, Appearance[]>();

  for (const input of inputs) {
    if (!input.items.length) continue;
    for (const [item, p] of percentiles(input)) {
      const key = normalizeUrl(item.url);
      const g = groups.get(key) ?? [];
      g.push({ item, heat: heatOf(p, input, item.publishedAt, now) });
      groups.set(key, g);
    }
  }

  const out: TrendingItem[] = [];
  for (const g of mergeByHeadline([...groups.values()])) {
    // Keep one appearance per source (the hottest).
    const bySource = new Map<string, Appearance>();
    for (const e of g) {
      const prev = bySource.get(e.item.source);
      if (!prev || e.heat > prev.heat) bySource.set(e.item.source, e);
    }
    const apps = [...bySource.values()].sort((a, b) => b.heat - a.heat);
    const heat = apps[0].heat * (1 + TRENDING.crossSourceBoost * (apps.length - 1));
    out.push({ item: apps[0].item, heat, appearances: apps.map((a) => a.item) });
  }

  return out.sort((a, b) => b.heat - a.heat).slice(0, limit);
}
