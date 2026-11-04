import { decodeEntities, stripTags } from './entities';

/** A parsed RSS `<item>` or Atom `<entry>`. All strings are decoded plain text. */
export interface FeedEntry {
  title: string;
  link: string;
  id?: string;
  published?: string;
  updated?: string;
  /** Raw (decoded) HTML content/description. Never render this. */
  content?: string;
}

function unwrap(raw: string): string {
  const cdata = raw.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodeEntities(raw);
}

function tag(xml: string, name: string): string | undefined {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? unwrap(m[1]).trim() : undefined;
}

function atomLink(xml: string): string | undefined {
  const links = xml.match(/<link\b[^>]*>/gi) ?? [];
  let fallback: string | undefined;
  for (const l of links) {
    const href = l.match(/\bhref\s*=\s*"([^"]*)"/i)?.[1];
    if (!href) continue;
    const rel = l.match(/\brel\s*=\s*"([^"]*)"/i)?.[1];
    if (!rel || rel === 'alternate') return decodeEntities(href);
    fallback ??= decodeEntities(href);
  }
  return fallback;
}

/**
 * Minimal, dependency-free RSS 2.0 / Atom parser. Good enough for the curated
 * feeds this project uses; it is not a general-purpose XML parser.
 */
export function parseFeed(xml: string): FeedEntry[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) ?? [];

  return blocks
    .map((b): FeedEntry => {
      const title = stripTags(tag(b, 'title') ?? '');
      if (isAtom) {
        return {
          title,
          link: atomLink(b) ?? '',
          id: tag(b, 'id'),
          published: tag(b, 'published'),
          updated: tag(b, 'updated'),
          content: tag(b, 'content') ?? tag(b, 'summary'),
        };
      }
      return {
        title,
        link: tag(b, 'link') ?? '',
        id: tag(b, 'guid'),
        published: tag(b, 'pubDate') ?? tag(b, 'dc:date'),
        content: tag(b, 'content:encoded') ?? tag(b, 'description'),
      };
    })
    .filter((e) => e.title && e.link);
}

/** Parse a date string to ISO, or undefined if invalid. */
export function toIso(d: string | undefined): string | undefined {
  if (!d) return undefined;
  const t = Date.parse(d);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}
