import { TRENDING } from './config';
import { normalizeUrl } from './normalize-url';
import { ageHours, relativeAge } from './time';
import type { Item, Lean, Spectrum, TrendingItem } from './types';

export interface TrendingInput {
  items: Item[];
  hasScore: boolean;
  undated?: boolean;
  weight?: number;
  /** Display name, for explaining a story's placement. */
  name?: string;
  /** Unscored, but the feed's order does reflect popularity (e.g. Reddit "hot"). */
  rankedFeed?: boolean;
  /** Groups feeds from one organization; defaults to each item's source. */
  publisher?: string;
  social?: boolean;
  lean?: Lean;
}

/** A story's score within its source, and its rank when the source has a meaningful order. */
interface Standing {
  percentile: number;
  rank?: number;
  of?: number;
}

/**
 * Score within a source, 1 = best. Scored sources rank by score and popularity-
 * ordered feeds by position. Other feeds are ordered only by time, which age
 * decay already covers, so they all get one baseline. Short lists are pulled
 * toward the middle, so topping a two-story list isn't worth topping fifty.
 */
function standings(input: TrendingInput): Map<Item, Standing> {
  if (!input.hasScore && !input.rankedFeed) {
    return new Map(input.items.map((item) => [item, { percentile: TRENDING.unscoredBaseline }]));
  }
  const ranked = input.hasScore ? [...input.items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) : input.items;
  const len = ranked.length;
  const confidence = Math.min(1, len / TRENDING.fullListSize);
  return new Map(ranked.map((item, i) => [item, { percentile: 0.5 + ((len - i) / len - 0.5) * confidence, rank: i + 1, of: len }]));
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

/** How many outlets a story's coverage is worth; social sources count for less. */
function agreement(publishers: Map<string, number>): number {
  const values = [...publishers.values()];
  return values.reduce((a, b) => a + b, 0) - Math.max(...values);
}

/** Whether left and right both cover a story, or at least two outlets on one side only. */
function spectrumOf(leans: (Lean | undefined)[]): Spectrum | undefined {
  const left = leans.filter((l) => l === 'left').length;
  const right = leans.filter((l) => l === 'right').length;
  if (left && right) return 'both';
  if (left >= 2) return 'left';
  if (right >= 2) return 'right';
  return undefined;
}

const publishedPhrase = (age: string): string => (age === 'now' ? 'Published just now.' : age ? `Published ${age} ago.` : '');

function listNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Stop one publisher filling the list. Stories it alone is carrying wait for a
 * later block of ranks once it has used its share; stories several publishers
 * cover are never held back.
 */
function capPublishers<T extends { publisher?: string }>(sorted: T[]): T[] {
  const remaining = [...sorted];
  const used = new Map<string, number>();
  const out: T[] = [];
  while (remaining.length) {
    const allowance = TRENDING.capPerPublisher * (Math.floor(out.length / TRENDING.capBlock) + 1);
    let i = remaining.findIndex((s) => !s.publisher || (used.get(s.publisher) ?? 0) < allowance);
    if (i < 0) i = 0;
    const [next] = remaining.splice(i, 1);
    if (next.publisher) used.set(next.publisher, (used.get(next.publisher) ?? 0) + 1);
    out.push(next);
  }
  return out;
}

/**
 * Blend items from several sources into one ranked, de-duplicated list.
 * Stories sharing a normalized URL or a closely matching headline collapse
 * into one entry with every source listed, and are boosted per extra publisher.
 */
export function buildTrending(inputs: TrendingInput[], limit: number, now = Date.now()): TrendingItem[] {
  const groups = new Map<string, Appearance[]>();
  const inputOf = new Map<string, TrendingInput>();
  const standingOf = new Map<Item, Standing>();

  for (const input of inputs) {
    if (!input.items.length) continue;
    for (const [item, standing] of standings(input)) {
      inputOf.set(item.source, input);
      standingOf.set(item, standing);
      const key = normalizeUrl(item.url);
      const g = groups.get(key) ?? [];
      g.push({ item, heat: heatOf(standing.percentile, input, item.publishedAt, now) });
      groups.set(key, g);
    }
  }

  const stories: (TrendingItem & { publisher?: string })[] = [];
  for (const g of mergeByHeadline([...groups.values()])) {
    // Keep one appearance per source (the hottest).
    const bySource = new Map<string, Appearance>();
    for (const e of g) {
      const prev = bySource.get(e.item.source);
      if (!prev || e.heat > prev.heat) bySource.set(e.item.source, e);
    }
    const apps = [...bySource.values()].sort((a, b) => b.heat - a.heat);

    const publishers = new Map<string, number>();
    for (const { item } of apps) {
      const input = inputOf.get(item.source);
      const id = input?.publisher ?? item.source;
      const value = input?.social ? TRENDING.socialAgreement : 1;
      publishers.set(id, Math.max(publishers.get(id) ?? 0, value));
    }
    const spectrum = spectrumOf(apps.map((a) => inputOf.get(a.item.source)?.lean));
    const heat =
      apps[0].heat *
      (1 + TRENDING.crossSourceBoost * agreement(publishers)) *
      (spectrum === 'both' ? 1 + TRENDING.crossSpectrumBoost : 1);

    const lead = apps[0].item;
    const leadInput = inputOf.get(lead.source);
    const standing = standingOf.get(lead);
    const names = apps.map((a) => inputOf.get(a.item.source)?.name ?? a.item.source);
    const why = [
      publishers.size > 1 ? `Covered by ${listNames(names)}.` : standing?.rank ? '' : `From ${names[0]}.`,
      spectrum === 'both' ? 'Both left- and right-leaning outlets are covering it.' : '',
      spectrum && spectrum !== 'both' ? `Only ${spectrum}-leaning outlets matched so far.` : '',
      standing?.rank ? `Ranked #${standing.rank} of ${standing.of} on ${names[0]}.` : '',
      leadInput?.undated ? '' : publishedPhrase(relativeAge(lead.publishedAt, now)),
    ]
      .filter(Boolean)
      .join(' ');

    stories.push({
      item: lead,
      heat,
      appearances: apps.map((a) => a.item),
      why,
      spectrum,
      publisher: publishers.size === 1 ? [...publishers.keys()][0] : undefined,
    });
  }

  return capPublishers(stories.sort((a, b) => b.heat - a.heat))
    .slice(0, limit)
    .map(({ publisher: _publisher, ...story }) => story);
}
