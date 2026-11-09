/** Tunable constants. Keep all magic numbers here. */

/** How long fetched source data is considered fresh. */
export const SOURCE_TTL_MS = 10 * 60 * 1000;

/** How long the last good data is kept for a source that stops responding (seconds). */
export const LAST_GOOD_TTL_S = 7 * 24 * 60 * 60;

/** Give up on a shared-cache read after this long and fetch the source instead. */
export const SHARED_CACHE_TIMEOUT_MS = 300;

/** CDN cache header for rendered pages. */
export const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600';

/** Items per card. */
export const DEFAULT_ITEMS = 20;
export const MIN_ITEMS = 5;
export const MAX_ITEMS = 50;

/** Trending "heat" scoring (see docs/requirements.md FR-13). */
export const TRENDING = {
  /** Weight for sources without native scores (ranked by recency instead). */
  unscoredWeight: 0.5,
  /**
   * Age decay: heat is multiplied by 1 / (1 + age / decayHours), so an item
   * this many hours old counts half as much as a brand-new one.
   */
  decayHours: 12,
  /** Extra multiplier per additional source a story appears on. */
  crossSourceBoost: 0.5,
  /** Age assumed for items from undated sources. */
  undatedAgeHours: 12,
  /** Headlines count as the same story with at least this many meaningful words in common… */
  titleMatchMinWords: 4,
  /** …and at least this share of their combined words (Jaccard similarity, 0–1)… */
  titleMatchSimilarity: 0.5,
  /** …when published within this many hours of each other. */
  titleMatchMaxHoursApart: 48,
} as const;

/** Shown behind the Trending card's info button; generated from TRENDING so it stays accurate. */
export const TRENDING_SORT_DESCRIPTION =
  "Blends the visible cards into one list. Each story's rank within its own source becomes a 0–1 score, " +
  `multiplied by a source weight (${TRENDING.unscoredWeight} for RSS feeds without votes, lower for some noisy sources) ` +
  `and reduced as it ages (a ${TRENDING.decayHours}-hour-old story counts half as much). ` +
  `Stories on several sources, with the same link or a closely matching headline, are merged into one entry and get a ${TRENDING.crossSourceBoost * 100}% boost for each extra source.`;
