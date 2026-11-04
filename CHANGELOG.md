# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Hacker News card now matches the real front-page order (via the official `topstories.json`), falling back to points order.

### Added

- ⓘ button on every card explaining how it is sorted.

### Added

- Initial dashboard: Trending card plus cards for Hacker News, Lobsters, Reddit, GitHub Trending, Product Hunt, dev.to, Bluesky, Mastodon, TechCrunch, The Verge and Ars Technica.
- URL-based configuration (`cards`, `n`, `n.<id>`, `window`) with a no-JavaScript Customize form.
- Edge caching with stale-while-revalidate; graceful per-source failure.
- Skeleton responsive layout with mobile swipe and automatic dark mode.
