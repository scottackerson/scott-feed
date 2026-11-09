# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Topic sections, with tabs in the top bar. Tech stays at `/`, with new sections at `/news`, `/politics`, `/healthcare`, `/sports` and `/3d-printing`. Each section has its own Trending card, and all settings carry across tabs (`cards.<section>` holds a section's card list).

### Changed

- Trending scoring: plain RSS feeds no longer get credit for recency twice, short lists count for less, feeds from one publisher count once, social sources count less toward coverage, and one publisher can't fill the list. Politics stories are labeled and boosted by left and right coverage, and every Trending row has a "why" link.
- Trending now merges stories with closely matching headlines from different sources, not just identical URLs.
- New "Ticker" look: dense, dark-first layout with monospace labels, numbered rows, short source codes and a light variant that follows the system theme. Customize moved into a dropdown in the top bar.
- Hacker News card now matches the real front-page order (via the official `topstories.json`), falling back to points order.

### Fixed

- A failing source was fetched again on every page render, which could prolong Reddit's rate limiting. It now waits 5 minutes between attempts.
- A source that stopped responding often showed "Unavailable right now", because the last good data lived only in one server instance's memory. It is now also kept for 7 days in Vercel's Runtime Cache (`@vercel/functions`), so the card keeps showing it with its original time, with its time in red to show it isn't current. Trending's time turns red too. The top bar's "updated" time now shows the most recent successful fetch instead of the oldest.
- Card and page "updated" times always said "just now", because the age was fixed when the server built the page. They now show the clock time in your own time zone, and story ages ("3h") keep counting while the tab stays open.
- On phones the whole page could scroll sideways: hidden screen-reader labels escaped the card strip and widened the page.

### Added

- Theme setting: `theme=dark` or `theme=light` (Customize → Theme) forces a color theme; the default, System, follows the device as before.
- Hacker News "momentum" order (`sort.hn=momentum`, or the Sort column in Customize): stories from the last 24 hours ranked by points per hour, so fast-climbing stories rise to the top. Sources can now offer alternative orders per card.
- Vercel Web Analytics via `@vercel/analytics` (cookieless, first-party page-view counts; production only). Scripts are never inlined (`assetsInlineLimit: 0`) so they pass the CSP.
- New sources: Techmeme, r/LocalLLaMA, Hugging Face Daily Papers, Tildes ~tech, Simon Willison's Weblog and The New Stack.
- ⓘ button on every card with a short blurb about the source site and an explanation of how the card is sorted.

### Added

- Initial dashboard: Trending card plus cards for Hacker News, Lobsters, Reddit, GitHub Trending, Product Hunt, dev.to, Bluesky, Mastodon, TechCrunch, The Verge and Ars Technica.
- URL-based configuration (`cards`, `n`, `n.<id>`, `window`) with a no-JavaScript Customize form.
- Edge caching with stale-while-revalidate; graceful per-source failure.
- Skeleton responsive layout with mobile swipe and automatic dark mode.
