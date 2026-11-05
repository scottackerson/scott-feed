# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- New "Ticker" look: dense, dark-first layout with monospace labels, numbered rows, short source codes and a light variant that follows the system theme. Customize moved into a dropdown in the top bar.
- Hacker News card now matches the real front-page order (via the official `topstories.json`), falling back to points order.

### Fixed

- A source that stopped responding often showed "Unavailable right now", because the last good data lived only in one server instance's memory. It is now also kept for 7 days in Vercel's Runtime Cache (`@vercel/functions`), so the card keeps showing it with its original time, with its time in red to show it isn't current. Trending's time turns red too. The top bar's "updated" time now shows the most recent successful fetch instead of the oldest.
- Card and page "updated" times always said "just now", because the age was fixed when the server built the page. They now show the clock time in your own time zone, and story ages ("3h") keep counting while the tab stays open.
- On phones the whole page could scroll sideways: hidden screen-reader labels escaped the card strip and widened the page.

### Added

- Hacker News "momentum" order (`sort.hn=momentum`, or the Sort column in Customize): stories from the last 24 hours ranked by points per hour, so fast-climbing stories rise to the top. Sources can now offer alternative orders per card.
- Vercel Web Analytics via `@vercel/analytics` (cookieless, first-party page-view counts; production only). Scripts are never inlined (`assetsInlineLimit: 0`) so they pass the CSP.
- New sources: Techmeme, r/LocalLLaMA, Hugging Face Daily Papers, Tildes ~tech, Simon Willison's Weblog and The New Stack.
- ⓘ button on every card with a short blurb about the source site and an explanation of how the card is sorted.

### Added

- Initial dashboard: Trending card plus cards for Hacker News, Lobsters, Reddit, GitHub Trending, Product Hunt, dev.to, Bluesky, Mastodon, TechCrunch, The Verge and Ars Technica.
- URL-based configuration (`cards`, `n`, `n.<id>`, `window`) with a no-JavaScript Customize form.
- Edge caching with stale-while-revalidate; graceful per-source failure.
- Skeleton responsive layout with mobile swipe and automatic dark mode.
