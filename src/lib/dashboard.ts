import { loadSource } from './cache';
import { countFor, type ViewConfig } from './params';
import { ageHours, WINDOWS } from './time';
import { buildTrending } from './trending';
import type { Item, Source, SourceResult, TrendingItem } from './types';
import { SECTION_BY_SLUG, SOURCE_BY_ID, TRENDING_ID } from '../sources';

export type CardData =
  | {
      kind: 'trending';
      id: string;
      items: TrendingItem[];
      fetchedAt?: number;
      sources: Source[];
      /** Sources that couldn't be reached, so their stories are from an earlier fetch. */
      staleSources: Source[];
    }
  | { kind: 'source'; id: string; result: SourceResult; items: Item[] };

/** Load everything the configured view needs, in parallel. */
export async function loadDashboard(cfg: ViewConfig, now = Date.now()): Promise<CardData[]> {
  const shownSources = cfg.cards.filter((id) => id !== TRENDING_ID);
  const wantsTrending = cfg.cards.includes(TRENDING_ID);

  // Trending blends the visible sources, or the whole section if it's shown alone.
  const trendingIds = shownSources.length ? shownSources : (SECTION_BY_SLUG.get(cfg.section)?.sources ?? []).map((s) => s.id);
  const needed = new Set([...shownSources, ...(wantsTrending ? trendingIds : [])]);

  const results = new Map<string, SourceResult>();
  await Promise.all(
    [...needed].map(async (id) => {
      const s = SOURCE_BY_ID.get(id);
      const sort = s?.sorts?.others.find((m) => m.id === cfg.sort[id]);
      if (s) results.set(id, await loadSource(s, sort));
    }),
  );

  const maxAge = WINDOWS[cfg.window];
  const inWindow = (items: Item[]) => items.filter((i) => ageHours(i.publishedAt, now) <= maxAge);

  return cfg.cards.flatMap((id): CardData[] => {
    if (id === TRENDING_ID) {
      const inputs = trendingIds.map((sid) => results.get(sid)).filter((r): r is SourceResult => !!r);
      const fetched = inputs.map((r) => r.fetchedAt).filter((t): t is number => t !== undefined);
      return [
        {
          kind: 'trending',
          id,
          items: buildTrending(
            inputs.map((r) => ({
              items: inWindow(r.items),
              hasScore: r.source.hasScore,
              undated: r.source.undated,
              weight: r.source.trendingWeight,
            })),
            countFor(cfg, id),
            now,
          ),
          fetchedAt: fetched.length ? Math.min(...fetched) : undefined,
          sources: inputs.map((r) => r.source),
          staleSources: inputs.filter((r) => r.status === 'stale').map((r) => r.source),
        },
      ];
    }
    const result = results.get(id);
    if (!result) return [];
    return [{ kind: 'source', id, result, items: inWindow(result.items).slice(0, countFor(cfg, id)) }];
  });
}
