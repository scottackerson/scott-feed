import { defineMiddleware } from 'astro:middleware';

/** Umami Cloud analytics: its script and its event endpoint (NFR-5). */
const UMAMI = 'https://cloud.umami.is';

const CSP = [
  "default-src 'self'",
  `script-src 'self' ${UMAMI}`,
  // Astro may inline small stylesheets.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  `connect-src 'self' ${UMAMI}`,
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

/** Security headers on every response (NFR-14). */
export const onRequest = defineMiddleware(async (_ctx, next) => {
  const res = await next();
  res.headers.set('Content-Security-Policy', CSP);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  return res;
});
