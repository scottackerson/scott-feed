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
  /** The section being viewed. */
  section: string;
  /** Card ids to show in this section, in display order. */
  cards: string[];
  /** Customized card lists of the other sections, so they survive tab switches. */
  otherCards: Record<string, string[]>;
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

/**
 * Each section's card ids in default order. The first section is the primary
 * one and uses the plain `cards` param; the others use `cards.<section>`.
 * A bare array means a single section.
 */
export type CardLayout = Readonly<Record<string, readonly string[]>>;

const toLayout = (cards: readonly string[] | CardLayout): CardLayout =>
  Array.isArray(cards) ? { '': cards as readonly string[] } : (cards as CardLayout);

const primaryOf = (layout: CardLayout): string => Object.keys(layout)[0];
const cardsKey = (layout: CardLayout, section: string): string =>
  section === primaryOf(layout) ? 'cards' : `cards.${section}`;
/** Every card id across all sections, once each, in layout order. */
const allIds = (layout: CardLayout): string[] => [...new Set(Object.values(layout).flat())];
const sameList = (a: readonly string[], b: readonly string[]): boolean => a.join(',') === b.join(',');

function parseCount(v: string | null): number | undefined {
  if (v == null || v.trim() === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(MAX_ITEMS, Math.max(MIN_ITEMS, Math.round(n)));
}

export function defaultConfig(allCards: readonly string[], section = ''): ViewConfig {
  return {
    section,
    cards: [...allCards],
    otherCards: {},
    n: DEFAULT_ITEMS,
    perCard: {},
    window: DEFAULT_WINDOW,
    theme: DEFAULT_THEME,
    sort: {},
  };
}

/** A section's card list from the URL, or undefined if absent or entirely invalid. */
function parseCards(raw: string | null, valid: readonly string[]): string[] | undefined {
  if (raw == null) return undefined;
  const allowed = new Set(valid);
  const seen = new Set<string>();
  const cards = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((id) => allowed.has(id) && !seen.has(id) && seen.add(id));
  return cards.length ? cards : undefined;
}

/**
 * Parse a view config from URL params. Unknown or invalid values are ignored
 * and fall back to defaults; this never throws.
 *
 * `layout` lists the valid card ids per section (or one list for a single
 * section); `sorts` lists the cards that have alternative orders
 * (`sort.<id>=<mode>`). `section` is the section being viewed, defaulting to
 * the primary one. Settings for every section are parsed, not just this one's.
 */
export function parseParams(
  params: URLSearchParams,
  layout: readonly string[] | CardLayout,
  sorts: SortOptions = {},
  section?: string,
): ViewConfig {
  const sections = toLayout(layout);
  const current = section ?? primaryOf(sections);
  const cfg = defaultConfig(sections[current], current);

  for (const [slug, defaults] of Object.entries(sections)) {
    const cards = parseCards(params.get(cardsKey(sections, slug)), defaults);
    if (!cards) continue;
    if (slug === current) cfg.cards = cards;
    else if (!sameList(cards, defaults)) cfg.otherCards[slug] = cards;
  }

  cfg.n = parseCount(params.get('n')) ?? DEFAULT_ITEMS;

  for (const id of allIds(sections)) {
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
  layout: readonly string[] | CardLayout,
  sorts: SortOptions = {},
  section?: string,
): ViewConfig {
  const base = parseParams(params, layout, sorts, section);
  const allCards = toLayout(layout)[base.section];
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
export function toQuery(cfg: ViewConfig, layout: readonly string[] | CardLayout): string {
  const sections = toLayout(layout);
  const ids = allIds(sections);
  const parts: string[] = [];
  for (const [slug, defaults] of Object.entries(sections)) {
    const cards = slug === cfg.section ? cfg.cards : cfg.otherCards[slug];
    if (cards && !sameList(cards, defaults)) parts.push(`${cardsKey(sections, slug)}=${cards.join(',')}`);
  }
  if (cfg.n !== DEFAULT_ITEMS) parts.push(`n=${cfg.n}`);
  if (cfg.window !== DEFAULT_WINDOW) parts.push(`window=${cfg.window}`);
  if (cfg.theme !== DEFAULT_THEME) parts.push(`theme=${cfg.theme}`);
  for (const id of ids) {
    const v = cfg.perCard[id];
    if (v !== undefined && v !== cfg.n) parts.push(`n.${id}=${v}`);
  }
  for (const id of ids) {
    if (cfg.sort[id]) parts.push(`sort.${id}=${cfg.sort[id]}`);
  }
  return parts.join('&');
}

/**
 * Settings for other sections, as hidden form fields. The Customize form only
 * has inputs for the section being viewed, so without these a save would lose
 * everything else in the URL.
 */
export function offSectionFields(cfg: ViewConfig, layout: CardLayout): [string, string][] {
  const here = new Set(layout[cfg.section]);
  const fields: [string, string][] = [];
  for (const [slug, cards] of Object.entries(cfg.otherCards)) fields.push([cardsKey(layout, slug), cards.join(',')]);
  for (const id of allIds(layout)) {
    if (here.has(id)) continue;
    if (cfg.perCard[id] !== undefined) fields.push([`n.${id}`, String(cfg.perCard[id])]);
    if (cfg.sort[id]) fields.push([`sort.${id}`, cfg.sort[id]]);
  }
  return fields;
}
