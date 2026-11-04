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
});
