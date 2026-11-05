import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMemoryCache, loadSource } from '../src/lib/cache';
import { SOURCE_TTL_MS } from '../src/lib/config';
import type { Item, Source } from '../src/lib/types';

const item: Item = { id: '1', title: 'Hello', url: 'https://a.com', publishedAt: '2026-11-04T00:00:00Z', source: 'x' };

function fakeSource(id: string, fetch: Source['fetch']): Source {
  return { id, name: id, code: id, about: '', homepage: 'https://a.com', hasScore: false, sortDescription: '', fetch };
}

describe('loadSource', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-11-05T12:00:00Z'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the last good data, with its original time, when a source fails', async () => {
    let up = true;
    const src = fakeSource('flaky', async () => {
      if (!up) throw new Error('down');
      return [item];
    });
    const first = await loadSource(src);
    expect(first.status).toBe('ok');

    up = false;
    vi.advanceTimersByTime(SOURCE_TTL_MS + 1);
    const later = await loadSource(src);
    expect(later.status).toBe('stale');
    expect(later.items.map((i) => i.title)).toEqual(['Hello']);
    expect(later.fetchedAt).toBe(first.fetchedAt);
  });

  it('a new instance falls back to the shared cache when a source fails', async () => {
    let up = true;
    const src = fakeSource('flaky-cold', async () => {
      if (!up) throw new Error('down');
      return [item];
    });
    const first = await loadSource(src);
    // Let the fire-and-forget shared-cache write land.
    await new Promise((r) => setTimeout(r, 0));

    up = false;
    clearMemoryCache();
    vi.advanceTimersByTime(SOURCE_TTL_MS + 1);
    const later = await loadSource(src);
    expect(later.status).toBe('stale');
    expect(later.fetchedAt).toBe(first.fetchedAt);
  });

  it('a new instance reuses fresh shared data without fetching', async () => {
    const fetch = vi.fn(async () => [item]);
    const src = fakeSource('shared-fresh', fetch);
    await loadSource(src);
    await new Promise((r) => setTimeout(r, 0));
    clearMemoryCache();
    const again = await loadSource(src);
    expect(again.status).toBe('ok');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('caches each sort order separately', async () => {
    const src = fakeSource('two-orders', async () => [item]);
    const alt = { id: 'alt', label: 'Alt', sortDescription: '', fetch: async () => [{ ...item, id: '2', title: 'Other' }] };
    const a = await loadSource(src);
    const b = await loadSource(src, alt);
    expect(a.items[0].title).toBe('Hello');
    expect(b.items[0].title).toBe('Other');
    expect(b.items[0].source).toBe('two-orders');
    expect(b.sort?.id).toBe('alt');
    expect(a.sort).toBeUndefined();
  });

  it('reports an error when there is no earlier data', async () => {
    const res = await loadSource(fakeSource('never', async () => Promise.reject(new Error('down'))));
    expect(res).toMatchObject({ status: 'error', items: [] });
  });
});
