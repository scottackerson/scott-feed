import { getCache, type RuntimeCache } from '@vercel/functions';
import { FAILURE_COOLDOWN_MS, LAST_GOOD_TTL_S, SHARED_CACHE_TIMEOUT_MS, SOURCE_TTL_MS } from './config';
import { isHttpUrl } from './normalize-url';
import type { Item, Source, SortMode, SourceResult } from './types';

interface Entry {
  items: Item[];
  fetchedAt: number;
}

/**
 * Two layers of cache, both holding the last good result per source:
 *
 * 1. `memory`: this function instance only. Fastest, but empty whenever Vercel
 *    starts a new instance.
 * 2. `shared`: Vercel's Runtime Cache, shared by every instance in a region
 *    (an in-memory stand-in when running locally). It lets a new instance
 *    reuse fresh data, and show the last good data when a source is down.
 *
 * Both are best-effort: if the shared cache fails, sources are fetched as usual.
 */
const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();
/** When each failing source last failed. Per instance, like `memory`. */
const failedAt = new Map<string, number>();

let shared: RuntimeCache | null | undefined;
function sharedCache(): RuntimeCache | null {
  if (shared === undefined) {
    try {
      shared = getCache({ namespace: 'scott-feed-v1' });
    } catch {
      shared = null;
    }
  }
  return shared;
}

function isEntry(v: unknown): v is Entry {
  const e = v as Entry | null;
  return !!e && typeof e.fetchedAt === 'number' && Array.isArray(e.items);
}

/** Read the shared cache, giving up quickly so a slow cache never slows the page. */
async function readShared(key: string, sourceId: string): Promise<Entry | undefined> {
  const cache = sharedCache();
  if (!cache) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const v = await Promise.race([
      cache.get(key),
      new Promise<null>((r) => (timer = setTimeout(() => r(null), SHARED_CACHE_TIMEOUT_MS))),
    ]);
    if (!isEntry(v)) return undefined;
    // Re-sanitize: the shared cache is outside this process.
    return { fetchedAt: v.fetchedAt, items: sanitize(v.items, sourceId) };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

function writeShared(key: string, entry: Entry): void {
  sharedCache()
    ?.set(key, entry, { ttl: LAST_GOOD_TTL_S, name: `source:${key}` })
    .catch(() => {});
}

/** Test hook: forget this instance's memory, as a brand-new instance would. */
export function clearMemoryCache(): void {
  memory.clear();
  failedAt.clear();
}

const MAX_TITLE = 300;

/** Drop malformed items and enforce URL/title safety rules (NFR-12, NFR-13). */
export function sanitize(items: Item[], sourceId: string): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const it of items) {
    const title = it.title?.trim();
    if (!title || !isHttpUrl(it.url) || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push({
      ...it,
      source: sourceId,
      title: title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1)}…` : title,
      discussionUrl: it.discussionUrl && isHttpUrl(it.discussionUrl) ? it.discussionUrl : undefined,
      publishedAt: Number.isNaN(Date.parse(it.publishedAt)) ? new Date().toISOString() : it.publishedAt,
    });
  }
  return out;
}

function refresh(key: string, sourceId: string, fetch: () => Promise<Item[]>): Promise<Entry> {
  let p = inflight.get(key);
  if (!p) {
    p = fetch()
      .then((items) => {
        const entry = { items: sanitize(items, sourceId), fetchedAt: Date.now() };
        if (!entry.items.length) throw new Error(`${key}: no items`);
        memory.set(key, entry);
        writeShared(key, entry);
        return entry;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

const isFresh = (e: Entry | undefined): boolean => !!e && Date.now() - e.fetchedAt < SOURCE_TTL_MS;

/**
 * Load a source: fresh cached data if there is any, otherwise fetch it. If the
 * fetch fails, fall back to the last good data with status 'stale' and its
 * original fetch time, and leave that source alone for FAILURE_COOLDOWN_MS so a
 * site that is failing or rate-limiting us isn't asked again on every render.
 */
export async function loadSource(source: Source, sort?: SortMode): Promise<SourceResult> {
  // Each order is cached separately: "hn" and "hn~momentum" are different lists.
  const key = sort ? `${source.id}~${sort.id}` : source.id;
  const base = { source, ...(sort && { sort }) };
  let cached = memory.get(key);
  if (!isFresh(cached)) {
    const fromShared = await readShared(key, source.id);
    if (fromShared && (!cached || fromShared.fetchedAt > cached.fetchedAt)) {
      cached = fromShared;
      memory.set(key, fromShared);
    }
  }
  if (cached && isFresh(cached)) {
    return { ...base, items: cached.items, status: 'ok', fetchedAt: cached.fetchedAt };
  }
  const notRetried = (): SourceResult =>
    cached ? { ...base, items: cached.items, status: 'stale', fetchedAt: cached.fetchedAt } : { ...base, items: [], status: 'error' };
  const lastFailure = failedAt.get(key);
  if (lastFailure !== undefined && Date.now() - lastFailure < FAILURE_COOLDOWN_MS) return notRetried();
  try {
    const fresh = await refresh(key, source.id, sort ? () => sort.fetch() : () => source.fetch());
    failedAt.delete(key);
    return { ...base, items: fresh.items, status: 'ok', fetchedAt: fresh.fetchedAt };
  } catch (err) {
    failedAt.set(key, Date.now());
    console.error(`[scott-feed] source "${key}" failed:`, err instanceof Error ? err.message : err);
    return notRetried();
  }
}
