import { defineMiddleware } from 'astro:middleware';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // Astro may inline small stylesheets.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
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
