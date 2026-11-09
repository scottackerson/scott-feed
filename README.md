# scott-feed

A fast, cookie-free dashboard of what's trending, organized into topic sections: Tech at `/` and News at `/news`. The Tech section covers Hacker News, Lobsters, Techmeme, Reddit, r/LocalLLaMA, GitHub Trending, Hugging Face Daily Papers, Product Hunt, dev.to, Tildes, Bluesky, Mastodon, Simon Willison, TechCrunch, The Verge, Ars Technica and The New Stack, all on one page.

- **One card per source**, plus a **Trending** card per section that blends and dedupes the hottest stories in that section.
- **Stateless.** No accounts, cookies or local storage. Your configuration lives in the URL, so just bookmark it.
- **Private.** No cookies or personal data. The only analytics is Vercel Web Analytics: anonymous, cookieless page-view counts served from the site's own domain.
- **Light.** Server-rendered, works without JavaScript, under 15 KB of client JS, zero third-party requests.
- **Mobile-friendly.** Swipe between cards, and add it to your home screen.

> 🚧 Status: in development. See the [requirements](docs/requirements.md).

## Configure with URL parameters

| Param | Example | Meaning | Default |
|---|---|---|---|
| `cards` | `cards=trending,hn,lobsters` | Tech cards to show, in order | all |
| `cards.<section>` | `cards.news=trending,npr,bbc` | Cards to show in another section, in order | all |
| `n` | `n=20` | Items per card | `20` |
| `n.<id>` | `n.hn=30` | Per-card override (5–50) | — |
| `sort.<id>` | `sort.hn=momentum` | Per-card sort order where offered. Hacker News: `front` (front-page order) or `momentum` (fastest-climbing stories of the last 24h) | default order |
| `window` | `window=12h` | Max age: `6h` `12h` `24h` `48h` `7d` | `24h` |
| `theme` | `theme=light` | `auto` (follow the device), `dark` or `light` | `auto` |

Example: `/?cards=trending,hn,github&n=15&n.trending=30`

All settings stay in the URL when you switch section tabs, so one bookmark holds your whole setup. `n.trending` applies to every section's Trending card.

Tech card IDs: `trending`, `hn`, `lobsters`, `techmeme`, `reddit`, `localllama`, `github`, `hfpapers`, `producthunt`, `devto`, `tildes`, `bluesky`, `mastodon`, `simonw`, `techcrunch`, `verge`, `ars`, `newstack`.

News card IDs: `trending`, `nyt`, `npr`, `bbc`, `guardian`, `cbs`, `fox`, `aljazeera`, `redditnews`.

## Quick start

Requires Node 24.

```bash
npm install
npm run dev        # http://localhost:4321
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build for Vercel |
| `npm run check` | Type-check |
| `npm test` | Unit tests (offline, uses fixtures) |

## Deploy

Import the repo in [Vercel](https://vercel.com/new). No environment variables are needed. Astro and the Vercel adapter are detected automatically.

## How it works

- Each source is a small adapter in [`src/sources/`](src/sources/) that fetches and parses one API or feed on the server.
- Results are cached for 10 minutes (in memory, plus Vercel's Runtime Cache shared across function instances), and rendered pages are cached at Vercel's edge (`s-maxage=600, stale-while-revalidate`). Visitors almost always get a cached page.
- If a source fails, its card keeps the last good data (up to 7 days old) with its original time, marked in red. The rest of the page is unaffected.
- Trending converts each source's ranking to a 0–1 percentile, decays it by age, merges stories with the same URL or a closely matching headline, and boosts stories found on several sources. Constants live in [`src/lib/config.ts`](src/lib/config.ts).

## Contributing

Want another source? Open a **source request** issue or send a PR. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
