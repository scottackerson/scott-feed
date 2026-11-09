import { describe, expect, it } from 'vitest';
import { countFor, offSectionFields, parseForm, parseParams, toQuery } from '../src/lib/params';

const ALL = ['trending', 'hn', 'lobsters', 'reddit'];
const SORTS = { hn: { default: 'front', others: ['momentum'] } };
const p = (q: string) => new URLSearchParams(q);

describe('parseParams', () => {
  it('returns defaults for an empty query', () => {
    expect(parseParams(p(''), ALL)).toEqual({ section: '', cards: ALL, otherCards: {}, n: 20, perCard: {}, window: '24h', theme: 'auto', sort: {} });
  });

  it('respects card order and drops unknown/duplicate ids', () => {
    expect(parseParams(p('cards=hn,nope,trending,hn'), ALL).cards).toEqual(['hn', 'trending']);
  });

  it('falls back to defaults on garbage', () => {
    const cfg = parseParams(p('n=abc&cards=nope&window=1y&n.hn=x'), ALL);
    expect(cfg).toEqual({ section: '', cards: ALL, otherCards: {}, n: 20, perCard: {}, window: '24h', theme: 'auto', sort: {} });
  });

  it('clamps item counts to 5..50', () => {
    const cfg = parseParams(p('n=1000&n.hn=1'), ALL);
    expect(cfg.n).toBe(50);
    expect(countFor(cfg, 'hn')).toBe(5);
    expect(countFor(cfg, 'reddit')).toBe(50);
  });
});

describe('toQuery', () => {
  it('is empty for defaults', () => {
    expect(toQuery(parseParams(p(''), ALL), ALL)).toBe('');
  });

  it('is canonical regardless of input key order', () => {
    const a = toQuery(parseParams(p('n.hn=30&window=12h&cards=hn,trending&n=10'), ALL), ALL);
    const b = toQuery(parseParams(p('n=10&cards=hn,trending&n.hn=30&window=12h'), ALL), ALL);
    expect(a).toBe('cards=hn,trending&n=10&window=12h&n.hn=30');
    expect(a).toBe(b);
  });

  it('round-trips', () => {
    const q = 'cards=reddit,hn&n=15&n.reddit=40';
    expect(toQuery(parseParams(p(q), ALL), ALL)).toBe(q);
  });
});

describe('parseForm', () => {
  it('builds config from checkboxes and order fields', () => {
    const form = p('edit=1&n=20&window=24h&show=hn&show=trending&o.trending=2&o.hn=1&o.lobsters=3&n.hn=30&n.trending=');
    const cfg = parseForm(form, ALL);
    expect(cfg.cards).toEqual(['hn', 'trending']);
    expect(toQuery(cfg, ALL)).toBe('cards=hn,trending&n.hn=30');
  });

  it('keeps defaults if nothing is checked', () => {
    expect(parseForm(p('edit=1'), ALL).cards).toEqual(ALL);
  });
});

describe('sort modes', () => {
  it('accepts a known mode and puts it last in the canonical URL', () => {
    const cfg = parseParams(p('sort.hn=Momentum&n.hn=30'), ALL, SORTS);
    expect(cfg.sort).toEqual({ hn: 'momentum' });
    expect(toQuery(cfg, ALL)).toBe('n.hn=30&sort.hn=momentum');
  });

  it('drops the default mode, unknown modes and cards without modes', () => {
    expect(parseParams(p('sort.hn=front'), ALL, SORTS).sort).toEqual({});
    expect(parseParams(p('sort.hn=bogus&sort.lobsters=momentum'), ALL, SORTS).sort).toEqual({});
    expect(toQuery(parseParams(p('sort.hn=front'), ALL, SORTS), ALL)).toBe('');
  });

  it('reads the Customize select', () => {
    const cfg = parseForm(p('edit=1&show=hn&sort.hn=momentum'), ALL, SORTS);
    expect(toQuery(cfg, ALL)).toBe('cards=hn&sort.hn=momentum');
  });
});

describe('theme', () => {
  it('accepts dark/light, drops auto and garbage', () => {
    expect(parseParams(p('theme=Dark'), ALL).theme).toBe('dark');
    expect(toQuery(parseParams(p('theme=light&window=12h'), ALL), ALL)).toBe('window=12h&theme=light');
    expect(toQuery(parseParams(p('theme=auto'), ALL), ALL)).toBe('');
    expect(parseParams(p('theme=purple'), ALL).theme).toBe('auto');
  });
});

describe('sections', () => {
  const LAYOUT = { tech: ['trending', 'hn', 'lobsters'], news: ['trending', 'npr', 'bbc'] };

  it('uses `cards` for the primary section and `cards.<slug>` for the others', () => {
    const q = 'cards=hn,trending&cards.news=bbc';
    expect(parseParams(p(q), LAYOUT).cards).toEqual(['hn', 'trending']);
    expect(parseParams(p(q), LAYOUT, {}, 'news').cards).toEqual(['bbc']);
  });

  it('only accepts a section its own cards', () => {
    expect(parseParams(p('cards.news=hn,npr'), LAYOUT, {}, 'news').cards).toEqual(['npr']);
    expect(parseParams(p('cards.news=hn'), LAYOUT, {}, 'news').cards).toEqual(LAYOUT.news);
  });

  it('produces the same URL from every section, so tabs lose nothing', () => {
    const q = 'cards=hn&cards.news=bbc&n.hn=30&n.npr=10';
    expect(toQuery(parseParams(p(q), LAYOUT), LAYOUT)).toBe(q);
    expect(toQuery(parseParams(p(q), LAYOUT, {}, 'news'), LAYOUT)).toBe(q);
  });

  it('omits a list equal to its default', () => {
    expect(toQuery(parseParams(p('cards.news=trending,npr,bbc'), LAYOUT), LAYOUT)).toBe('');
  });

  it('keeps other sections through a Customize save', () => {
    const before = parseParams(p('cards=hn&n.hn=30&sort.hn=momentum&n.npr=9'), LAYOUT, { hn: { default: 'front', others: ['momentum'] } }, 'news');
    const fields = offSectionFields(before, LAYOUT);
    expect(fields).toEqual([['cards', 'hn'], ['n.hn', '30'], ['sort.hn', 'momentum']]);
    const form = new URLSearchParams([...fields, ['edit', '1'], ['show', 'npr'], ['n.npr', '12']]);
    const after = parseForm(form, LAYOUT, { hn: { default: 'front', others: ['momentum'] } }, 'news');
    expect(toQuery(after, LAYOUT)).toBe('cards=hn&cards.news=npr&n.hn=30&n.npr=12&sort.hn=momentum');
  });
});
