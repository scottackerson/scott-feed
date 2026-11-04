# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial dashboard: Trending card plus cards for Hacker News, Lobsters, Reddit, GitHub Trending, Product Hunt, dev.to, Bluesky, Mastodon, TechCrunch, The Verge and Ars Technica.
- URL-based configuration (`cards`, `n`, `n.<id>`, `window`) with a no-JavaScript Customize form.
- Edge caching with stale-while-revalidate; graceful per-source failure.
- Skeleton responsive layout with mobile swipe and automatic dark mode.
