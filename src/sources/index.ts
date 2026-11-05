/**
 * Source registry. Order here is the default card order.
 * To add a source: create `src/sources/<id>.ts` exporting a `Source`, then add it below.
 */
import type { SortOptions } from '../lib/params';
import type { Source } from '../lib/types';
import bluesky from './bluesky';
import devto from './devto';
import github from './github';
import hn from './hn';
import lobsters from './lobsters';
import mastodon from './mastodon';
import producthunt from './producthunt';
import hfpapers from './hfpapers';
import { ars, newstack, techcrunch, verge } from './publishers';
import reddit, { localllama } from './reddit';
import simonw from './simonw';
import techmeme from './techmeme';
import tildes from './tildes';

export const SOURCES: Source[] = [
  hn,
  lobsters,
  techmeme,
  reddit,
  localllama,
  github,
  hfpapers,
  producthunt,
  devto,
  tildes,
  bluesky,
  mastodon,
  simonw,
  techcrunch,
  verge,
  ars,
  newstack,
];

export const TRENDING_ID = 'trending';

/** All card ids in default order. */
export const ALL_CARDS: string[] = [TRENDING_ID, ...SOURCES.map((s) => s.id)];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

/** Cards with alternative orders, for URL parsing (`sort.<id>=<mode>`). */
export const SORT_OPTIONS: SortOptions = Object.fromEntries(
  SOURCES.filter((s) => s.sorts).map((s) => [
    s.id,
    { default: s.sorts!.default.id, others: s.sorts!.others.map((m) => m.id) },
  ]),
);
