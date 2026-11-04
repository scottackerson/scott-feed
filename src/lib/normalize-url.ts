const TRACKING_PARAMS = new Set([
  'ref',
  'ref_src',
  'source',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'cmpid',
  'smid',
]);

/** True if the string is an absolute http(s) URL. */
export function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Remove tracking params (utm_* and friends) but keep the URL otherwise intact. */
export function stripTracking(s: string): string {
  try {
    const u = new URL(s);
    for (const k of [...u.searchParams.keys()]) {
      if (k.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(k.toLowerCase())) u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return s;
  }
}

/**
 * Normalize a URL into a dedupe key: lowercase host, no `www.`, no protocol,
 * no tracking params, no hash, no trailing slash, sorted query.
 */
export function normalizeUrl(s: string): string {
  try {
    const u = new URL(stripTracking(s));
    const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');
    u.searchParams.sort();
    const q = u.searchParams.toString();
    const path = u.pathname.replace(/\/+$/, '') || '';
    return `${host}${path}${q ? `?${q}` : ''}`;
  } catch {
    return s.trim().toLowerCase();
  }
}

/** Display domain, e.g. "github.com". */
export function domainOf(s: string): string {
  try {
    return new URL(s).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
