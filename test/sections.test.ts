import { describe, expect, it } from 'vitest';
import { CARD_LAYOUT, SECTIONS, SOURCES, TRENDING_ID } from '../src/sources';

describe('section registry', () => {
  it('has unique section slugs', () => {
    const slugs = SECTIONS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has one source object per id, since ids key the cache and the URL', () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(TRENDING_ID);
  });

  it('uses ids that are safe in comma-separated URL params', () => {
    for (const s of SOURCES) expect(s.id).toMatch(/^[a-z0-9-]+$/);
    for (const s of SECTIONS) expect(s.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('starts every section with Trending', () => {
    for (const cards of Object.values(CARD_LAYOUT)) expect(cards[0]).toBe(TRENDING_ID);
  });

  it('keeps Politics balanced between left and right', () => {
    const politics = SECTIONS.find((s) => s.slug === 'politics')!;
    const lean = (side: string) => politics.sources.filter((s) => s.about.includes(`regarded as ${side}`));
    expect(lean('left-leaning').length).toBeGreaterThan(0);
    expect(lean('left-leaning').length).toBe(lean('right-leaning').length);
    const weights = [...lean('left-leaning'), ...lean('right-leaning')].map((s) => s.trendingWeight);
    expect(new Set(weights).size).toBe(1);
  });
});
