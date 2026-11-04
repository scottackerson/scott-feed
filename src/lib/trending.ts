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

/**
 * Blend items from several sources into one ranked, de-duplicated list.
 * Stories sharing a normalized URL collapse into one entry with every source
 * listed, and are boosted per extra source.
 */
export function buildTrending(inputs: TrendingInput[], limit: number, now = Date.now()): TrendingItem[] {
  const groups = new Map<string, { heat: number; item: Item }[]>();

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
  for (const g of groups.values()) {
    // Keep one appearance per source (the hottest).
    const bySource = new Map<string, { heat: number; item: Item }>();
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
