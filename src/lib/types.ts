/** A single story/link from a source. */
export interface Item {
  /** Stable within its source. */
  id: string;
  title: string;
  /** Article URL (http/https only). */
  url: string;
  /** Comments/discussion thread, if the source has one. */
  discussionUrl?: string;
  /** Native score (points, upvotes, stars today, likes…). */
  score?: number;
  comments?: number;
  /** ISO 8601. */
  publishedAt: string;
  /** Source id. */
  source: string;
}

/** A news source adapter. One module per source in `src/sources/`. */
export interface Source {
  /** Short, URL-safe id used in query params, e.g. "hn". */
  id: string;
  /** Display name, e.g. "Hacker News". */
  name: string;
  /** Short uppercase code for compact UI (nav chips, Trending badges), e.g. "HN". */
  code: string;
  homepage: string;
  /** Whether items carry a native popularity score. */
  hasScore: boolean;
  /**
   * Items have no real publish date (e.g. GitHub Trending). Trending scores
   * them with an assumed age instead of "now", and the UI hides their age.
   */
  undated?: boolean;
  /**
   * Multiplier for this source in Trending (default 1 for scored sources,
   * TRENDING.unscoredWeight otherwise). Lower it for noisy sources.
   */
  trendingWeight?: number;
  /**
   * One or two plain sentences about the source website itself, shown in the
   * card's info box above the sort explanation. Required.
   */
  about: string;
  /**
   * Plain-language explanation of how this card is ordered, shown behind the
   * card's info button. Required so every card can explain itself.
   */
  sortDescription: string;
  /** Label for the score, e.g. "points". */
  scoreLabel?: string;
  /** Fetch items in the source's native order. Throw on failure. */
  fetch(): Promise<Item[]>;
}

export type SourceStatus = 'ok' | 'stale' | 'error';

/** Result of loading a source through the cache. */
export interface SourceResult {
  source: Source;
  items: Item[];
  status: SourceStatus;
  /** When the data was fetched (ms epoch), or undefined if never. */
  fetchedAt?: number;
}

/** An item in the Trending card: one story possibly seen on several sources. */
export interface TrendingItem {
  item: Item;
  heat: number;
  /** All appearances, one per source, best first. */
  appearances: Item[];
}
