# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- New "Ticker" look: dense, dark-first layout with monospace labels, numbered rows, short source codes and a light variant that follows the system theme. Customize moved into a dropdown in the top bar.
- Hacker News card now matches the real front-page order (via the official `topstories.json`), falling back to points order.

### Fixed

- Card and page "updated" times always said "just now", because the age was fixed when the server built the page. They now show the clock time in your own time zone, and story ages ("3h") keep counting while the tab stays open.
- On phones the whole page could scroll sideways: hidden screen-reader labels escaped the card strip and widened the page.

### Added

- Vercel Web Analytics via `@vercel/analytics` (cookieless, first-party page-view counts; production only). Scripts are never inlined (`assetsInlineLimit: 0`) so they pass the CSP.
- New sources: Techmeme, r/LocalLLaMA, Hugging Face Daily Papers, Tildes ~tech, Simon Willison's Weblog and The New Stack.
- ⓘ button on every card with a short blurb about the source site and an explanation of how the card is sorted.

### Added

- Initial dashboard: Trending card plus cards for Hacker News, Lobsters, Reddit, GitHub Trending, Product Hunt, dev.to, Bluesky, Mastodon, TechCrunch, The Verge and Ars Technica.
- URL-based configuration (`cards`, `n`, `n.<id>`, `window`) with a no-JavaScript Customize form.
- Edge caching with stale-while-revalidate; graceful per-source failure.
- Skeleton responsive layout with mobile swipe and automatic dark mode.
