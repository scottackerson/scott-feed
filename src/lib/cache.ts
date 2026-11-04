import { SOURCE_TTL_MS } from './config';
import { isHttpUrl } from './normalize-url';
import type { Item, Source, SourceResult } from './types';

interface Entry {
  items: Item[];
  fetchedAt: number;
}

/**
 * Per-instance in-memory cache. On Vercel, warm function instances reuse it;
 * the CDN cache in front of the page absorbs nearly all traffic anyway.
 * Keeps the last good result so a failing source can show stale data.
 */
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

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

function refresh(source: Source): Promise<Entry> {
  let p = inflight.get(source.id);
  if (!p) {
    p = source
      .fetch()
      .then((items) => {
        const entry = { items: sanitize(items, source.id), fetchedAt: Date.now() };
        if (!entry.items.length) throw new Error(`${source.id}: no items`);
        store.set(source.id, entry);
        return entry;
      })
      .finally(() => inflight.delete(source.id));
    inflight.set(source.id, p);
  }
  return p;
}

/** Load a source, using cached data when fresh and stale data on failure. */
export async function loadSource(source: Source): Promise<SourceResult> {
  const cached = store.get(source.id);
  if (cached && Date.now() - cached.fetchedAt < SOURCE_TTL_MS) {
    return { source, items: cached.items, status: 'ok', fetchedAt: cached.fetchedAt };
  }
  try {
    const fresh = await refresh(source);
    return { source, items: fresh.items, status: 'ok', fetchedAt: fresh.fetchedAt };
  } catch (err) {
    console.error(`[scott-feed] source "${source.id}" failed:`, err instanceof Error ? err.message : err);
    if (cached) return { source, items: cached.items, status: 'stale', fetchedAt: cached.fetchedAt };
    return { source, items: [], status: 'error' };
  }
}
