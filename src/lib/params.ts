import { DEFAULT_ITEMS, MAX_ITEMS, MIN_ITEMS } from './config';
import { isWindowKey, type WindowKey } from './time';

export const DEFAULT_WINDOW: WindowKey = '24h';

/** Color theme: follow the device setting, or force one. */
export const THEMES = ['auto', 'dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'auto';
const isTheme = (s: string): s is Theme => (THEMES as readonly string[]).includes(s);

/** The full view configuration, derived entirely from the URL. */
export interface ViewConfig {
  /** Card ids to show, in display order. */
  cards: string[];
  /** Global items per card. */
  n: number;
  /** Per-card item count overrides. */
  perCard: Record<string, number>;
  window: WindowKey;
  theme: Theme;
  /** Per-card alternative sort order (mode id); absent means the default order. */
  sort: Record<string, string>;
}

/** For each card with alternative orders: the default mode id and the others. */
export type SortOptions = Readonly<Record<string, { default: string; others: readonly string[] }>>;

function parseCount(v: string | null): number | undefined {
  if (v == null || v.trim() === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(MAX_ITEMS, Math.max(MIN_ITEMS, Math.round(n)));
}

export function defaultConfig(allCards: readonly string[]): ViewConfig {
  return { cards: [...allCards], n: DEFAULT_ITEMS, perCard: {}, window: DEFAULT_WINDOW, theme: DEFAULT_THEME, sort: {} };
}

/**
 * Parse a view config from URL params. Unknown or invalid values are ignored
 * and fall back to defaults; this never throws.
 *
 * `allCards` is the list of valid card ids in default order; `sorts` lists
 * the cards that have alternative orders (`sort.<id>=<mode>`).
 */
export function parseParams(
  params: URLSearchParams,
  allCards: readonly string[],
  sorts: SortOptions = {},
): ViewConfig {
  const cfg = defaultConfig(allCards);
  const valid = new Set(allCards);

  const cardsParam = params.get('cards');
  if (cardsParam != null) {
    const seen = new Set<string>();
    const cards = cardsParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((id) => valid.has(id) && !seen.has(id) && seen.add(id));
    if (cards.length) cfg.cards = cards;
  }

  cfg.n = parseCount(params.get('n')) ?? DEFAULT_ITEMS;

  for (const id of allCards) {
    const v = parseCount(params.get(`n.${id}`));
    if (v !== undefined && v !== cfg.n) cfg.perCard[id] = v;
  }

  const w = params.get('window');
  if (w && isWindowKey(w)) cfg.window = w;

  const t = params.get('theme')?.trim().toLowerCase();
  if (t && isTheme(t)) cfg.theme = t;

  for (const [id, opts] of Object.entries(sorts)) {
    const v = params.get(`sort.${id}`)?.trim().toLowerCase();
    // The default mode (e.g. sort.hn=front) is valid but canonicalizes away.
    if (v && opts.others.includes(v)) cfg.sort[id] = v;
  }

  return cfg;
}

/**
 * Parse the Customize form submission (`edit=1`). Fields:
 * - `show` (repeated): card ids to display
 * - `o.<id>`: numeric display order
 * - `n`, `n.<id>`, `window`, `theme`, `sort.<id>`: as in the URL format
 */
export function parseForm(
  params: URLSearchParams,
  allCards: readonly string[],
  sorts: SortOptions = {},
): ViewConfig {
  const base = parseParams(params, allCards, sorts);
  const valid = new Set(allCards);
  const shown = params.getAll('show').filter((id) => valid.has(id));
  const order = (id: string) => {
    const raw = params.get(`o.${id}`)?.trim();
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) ? v : allCards.indexOf(id) + 1;
  };
  const cards = [...new Set(shown)].sort((a, b) => order(a) - order(b) || allCards.indexOf(a) - allCards.indexOf(b));
  return { ...base, cards: cards.length ? cards : base.cards };
}

/** Items to show for a given card. */
export function countFor(cfg: ViewConfig, id: string): number {
  return cfg.perCard[id] ?? cfg.n;
}

/**
 * Serialize a config to a canonical query string: stable key order, defaults
 * omitted. Equivalent views produce identical URLs (one CDN cache entry).
 * Returns "" for the default view.
 */
export function toQuery(cfg: ViewConfig, allCards: readonly string[]): string {
  const parts: string[] = [];
  if (cfg.cards.join(',') !== allCards.join(',')) parts.push(`cards=${cfg.cards.join(',')}`);
  if (cfg.n !== DEFAULT_ITEMS) parts.push(`n=${cfg.n}`);
  if (cfg.window !== DEFAULT_WINDOW) parts.push(`window=${cfg.window}`);
  if (cfg.theme !== DEFAULT_THEME) parts.push(`theme=${cfg.theme}`);
  for (const id of allCards) {
    const v = cfg.perCard[id];
    if (v !== undefined && v !== cfg.n) parts.push(`n.${id}=${v}`);
  }
  for (const id of allCards) {
    if (cfg.sort[id]) parts.push(`sort.${id}=${cfg.sort[id]}`);
  }
  return parts.join('&');
}
