// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  build: {
    // Small CSS is inlined to avoid an extra request on first paint.
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
  vite: {
    build: {
      // Never inline scripts: the CSP is `script-src 'self'`, which blocks
      // inline <script>. Small scripts (e.g. @vercel/analytics) would
      // otherwise be inlined and silently fail.
      assetsInlineLimit: 0,
    },
  },
});
