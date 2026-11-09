/**
 * Section and source registry. Order here is the default tab and card order.
 * To add a source: create `src/sources/<id>.ts` exporting a `Source`, then add
 * it to one or more sections below. A source can appear in several sections.
 * To add a section: add an entry to SECTIONS. The first section is the home page.
 */
import type { CardLayout, SortOptions } from '../lib/params';
import type { Section, Source } from '../lib/types';
import bluesky from './bluesky';
import devto from './devto';
import github from './github';
import hn from './hn';
import lobsters from './lobsters';
import mastodon from './mastodon';
import { aljazeera, bbc, cbs, fox, guardian, npr, nyt, redditNews } from './news';
import producthunt from './producthunt';
import hfpapers from './hfpapers';
import { ars, newstack, techcrunch, verge } from './publishers';
import reddit, { localllama } from './reddit';
import simonw from './simonw';
import techmeme from './techmeme';
import tildes from './tildes';

const TECH_SOURCES: Source[] = [
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

export const SECTIONS: Section[] = [
  {
    slug: 'tech',
    name: 'Tech',
    title: 'scott-feed: trending tech news',
    description: "A fast, stateless dashboard of what's trending in tech.",
    sources: TECH_SOURCES,
  },
  {
    slug: 'news',
    name: 'News',
    title: 'scott-feed: trending news',
    description: "A fast, stateless dashboard of today's top news.",
    sources: [nyt, npr, bbc, guardian, cbs, fox, aljazeera, redditNews],
  },
];

export const SECTION_BY_SLUG = new Map(SECTIONS.map((s) => [s.slug, s]));

/** The home page's section. */
export const PRIMARY_SECTION = SECTIONS[0];

/** A section's URL path. */
export const sectionPath = (section: Section): string => (section === PRIMARY_SECTION ? '/' : `/${section.slug}`);

/** Each section's card ids in default order. */
export const CARD_LAYOUT: CardLayout = Object.fromEntries(
  SECTIONS.map((s) => [s.slug, [TRENDING_ID, ...s.sources.map((source) => source.id)]]),
);

/** Every source once, across all sections. */
export const SOURCES: Source[] = [...new Set(SECTIONS.flatMap((s) => s.sources))];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

/** Cards with alternative orders, for URL parsing (`sort.<id>=<mode>`). */
export const SORT_OPTIONS: SortOptions = Object.fromEntries(
  SOURCES.filter((s) => s.sorts).map((s) => [
    s.id,
    { default: s.sorts!.default.id, others: s.sorts!.others.map((m) => m.id) },
  ]),
);
