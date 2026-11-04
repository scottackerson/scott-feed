# Contributing to scott-feed

Thanks for helping out! This project values **speed, simplicity and privacy**, so please keep that in mind with every change.

## Ground rules

- **No client-side state.** No cookies, `localStorage`, `sessionStorage` or IndexedDB. All config goes in URL parameters.
- **No third-party requests from the browser.** All source fetching happens on the server.
- **Works without JavaScript.** JS may enhance a feature, but never be required for it.
- **Respect the performance budget** in [docs/requirements.md §7.1](docs/requirements.md#71-performance-budgets).
- **Respect sources.** Prefer official APIs or RSS, cache aggressively, and link to the original instead of republishing content.

## Setup

```bash
npm install
npm run dev
```

Tests run offline against fixtures in `test/fixtures/`. Keep fixtures small and hand-written; don't commit full copies of third-party pages.

## Adding a source

1. Create `src/sources/<id>.ts` exporting a `parse()` function and a default `Source` (see `src/lib/types.ts` and any existing source). Plain RSS feeds can use `rssSource()` in `src/sources/publishers.ts`.
2. Write a `sortDescription` explaining, in plain language, how the card is ordered (shown behind the card's ⓘ button).
3. Add a header comment with the endpoint, terms-of-use notes and rate limits.
4. Save a sample response under `test/fixtures/<id>.*` and add a parser test.
5. Register the source in `src/sources/index.ts`.
6. Add its ID to the README.

## Pull request checklist

- [ ] `npm run check` (type-check) passes
- [ ] `npm test` passes
- [ ] No new client JS, or the reason is explained in the PR
- [ ] Docs updated (README, CHANGELOG)

