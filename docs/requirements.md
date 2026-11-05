# scott-feed — Product Requirements

| | |
|---|---|
| **Status** | Draft v1.0 — approved for build |
| **Last updated** | 2026-11-04 |
| **Target** | v1 ships 2026-11-04 (single-day build) |
| **Deploy target** | Vercel (Hobby / free tier) |

---

## 1. Summary

scott-feed is a fast, lightweight, browser-based dashboard that skims popular tech news sources and shows what's trending in one place. Every source gets its own card, and a **Trending** card blends the hottest stories across all sources. Clicking an item opens it in a new tab. It works the same on desktop and phone.

The app holds **no state**: no accounts, cookies, local storage or database. All configuration (which cards to show, their order, and how many items each holds) lives in the URL, so a configured view is just a bookmark.

## 2. Goals

1. **One place for tech news.** A single page replaces visiting HN, Lobsters, Reddit, GitHub Trending and similar sites one by one.
2. **Fast everywhere.** The page loads in under 1 second on a mid-range phone over 4G.
3. **Configurable without state.** Show/hide and reorder cards and set item counts, all through URL parameters.
4. **$0 to run.** Fits within Vercel's Hobby tier and the free tiers of every source.
5. **Easy to fork.** Clean open-source repo, and adding a new source takes one small file.

## 3. Non-goals (v1)

- Twitter / X (API cost of about $200/month and up; scraping breaks its terms).
- User accounts, login, sync, or any server-side user data.
- Cookies, `localStorage`, `sessionStorage` or IndexedDB.
- User-added custom feeds (the source list is curated in code).
- Keyword filters and mute words.
- Thumbnails, images, AI summaries.
- Save-for-later and read-state tracking. The browser's native `:visited` link styling is used instead, which needs no storage.
- Offline mode.
- Third-party analytics or tracking scripts (first-party, cookieless Vercel Web Analytics is allowed; see NFR-5).

## 4. Users

- **Primary:** the owner, checking tech news several times a day on a laptop and a phone.
- **Secondary:** anyone who finds the public deployment or forks the repo. The site is public and read-only; there is nothing to protect.

### User stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-1 | reader | see top stories from each source in its own card | I can scan by source |
| US-2 | reader | see a Trending card mixing the hottest stories across all sources | I can catch the biggest stories fast |
| US-3 | reader | click a story and have it open in a new tab | I don't lose my dashboard |
| US-4 | reader | jump to the discussion thread (HN/Reddit/Lobsters comments) | I can read the conversation |
| US-5 | reader | hide cards I don't care about and reorder the rest | the page fits my interests |
| US-6 | reader | choose how many items each card shows | I control density |
| US-7 | reader | bookmark my configured view | my settings come back without storage |
| US-8 | mobile reader | swipe between cards | the dashboard is usable on a phone |
| US-9 | reader | see the same story once in Trending, with badges for every source it appeared on | Trending isn't full of duplicates |
| US-10 | reader | add the site to my phone's home screen | it feels like an app |

## 5. Sources (v1)

All sources are curated in code. Six were added after launch (Techmeme, r/LocalLLaMA, HF Daily Papers, Tildes, Simon Willison, The New Stack). Each is fetched **server-side only**, never from the browser.

| ID | Source | Method | Native score | Discussion link | Notes / risk |
|---|---|---|---|---|---|
| `hn` | Hacker News | Algolia API `search?tags=front_page` for stories, official `topstories.json` for rank order | points | ✅ | Free, reliable. Falls back to points order if ranking fails. Optional **momentum** order (`sort.hn=momentum`): Algolia `search?tags=story` for the last 24h with ≥10 points, ranked by points ÷ (hours since posting + 1) |
| `lobsters` | Lobsters | `https://lobste.rs/hottest.json` | score | ✅ | Free, reliable |
| `reddit` | Reddit (r/programming, r/technology, r/webdev, r/MachineLearning) | Subreddit `.rss` / `.json` | upvotes (JSON only) | ✅ | **Risk:** Reddit often blocks datacenter IPs (403/429). Fail gracefully; may need OAuth app credentials (free) via env vars |
| `github` | GitHub Trending | Scrape `github.com/trending` HTML | stars today | ❌ | **Risk:** no official API; markup can change |
| `producthunt` | Product Hunt | RSS feed | — | ✅ | RSS has no votes; rank by recency |
| `devto` | dev.to | `https://dev.to/api/articles?top=1` | reactions | ✅ | Free, reliable |
| `bluesky` | Bluesky (tech feed) | Public AppView `app.bsky.feed.getFeed` on a curated tech feed | likes + reposts | ✅ (post) | Unauthenticated public API |
| `mastodon` | Mastodon trending links | `mastodon.social/api/v1/trends/links` | shares (history) | ❌ | Free, public |
| `techmeme` | Techmeme | RSS; original article URL taken from the description | — | ✅ (Techmeme page) | Editor-curated; Trending weight 0.7 |
| `localllama` | r/LocalLLaMA | Subreddit `.rss` | — | ✅ | Same risks as `reddit` |
| `hfpapers` | Hugging Face Daily Papers | `https://huggingface.co/api/daily_papers` (JSON) | upvotes | ✅ (HF page) | Links to arXiv; Trending weight 0.6 |
| `tildes` | Tildes ~tech | Atom `https://tildes.net/~tech/topics.atom` | votes | ✅ | Small community, low volume |
| `simonw` | Simon Willison's Weblog | Atom `https://simonwillison.net/atom/everything/` | — | ❌ | A few posts per day |
| `newstack` | The New Stack | RSS | — | ❌ | Rank by recency |
| `techcrunch` | TechCrunch | RSS | — | ❌ | Rank by recency |
| `verge` | The Verge | RSS/Atom | — | ❌ | Rank by recency |
| `ars` | Ars Technica | RSS | — | ❌ | Rank by recency |

The exact subreddit list, Bluesky feed URI and per-source item caps are constants in each source's module and can be changed with a one-line PR.

## 6. Functional requirements

### 6.1 Layout

- **FR-1** The page shows a **Trending** card followed by one card per enabled source.
- **FR-2** Desktop (≥ 768px): a responsive grid of cards with independent vertical scrolling, or a fixed card height with internal scroll.
- **FR-3** Mobile (< 768px): cards are full-width and swipeable horizontally using CSS scroll-snap, with a sticky row of source chips that jump to each card through anchor links. This must work without JavaScript.
- **FR-4** Each card header shows the source name, a link to the source's homepage, and the clock time its data was fetched, in the viewer's own time zone (for example "6:42 PM"). The server renders it in UTC ("00:42 UTC") and a small optional script, `public/local-time.js`, converts it. The top bar shows the oldest card's time. Story ages ("3h") stay relative, and the same script recounts them every minute so an open tab never shows stale ages.
- **FR-4a** Each card header has an info button (ⓘ) that reveals, on click, a short blurb about the source website (`Source.about`) and a plain-language explanation of how that card is sorted (`Source.sortDescription`). It uses native `<details>` so it works without JavaScript. Every source must provide both texts. The Trending card shows only its sort explanation.
- **FR-5** Visual style is "Ticker": dense, terminal-flavored, dark by default, with a light variant that follows `prefers-color-scheme`. There is no toggle, because a toggle would need stored state. Fonts are system stacks only (no web fonts).

### 6.2 Items

- **FR-6** Each item shows the title, domain, age (e.g. "3h") and native score or comment count when the source has one.
- **FR-7** The title links to the article URL with `target="_blank" rel="noopener noreferrer"`.
- **FR-8** When a discussion URL exists, a separate link (e.g. "142 comments") opens it in a new tab.
- **FR-9** Visited links are styled differently using the CSS `:visited` pseudo-class.
- **FR-10** Items are limited to the last **24 hours** by default. This can be changed with a URL parameter (see 6.4).

### 6.3 Trending card

- **FR-11** Trending blends items from all **enabled** sources.
- **FR-12** Duplicates are collapsed by **normalized URL**: lowercase host, `www.` removed, tracking parameters (`utm_*`, `ref`, `fbclid`, etc.) removed, trailing slash removed. A collapsed item shows a badge for each source it appeared on.
- **FR-13** Ranking uses a normalized "heat" score:
  - **Per-source normalization:** each item's native score becomes a percentile within its own source (0–1). Sources without scores (RSS) use recency rank as the percentile.
  - **Source weight:** 1.0 for scored sources and 0.5 for unscored ones by default. Noisy sources can lower it (Bluesky and Mastodon use 0.4, dev.to 0.6).
  - **Time decay:** `heat = percentile × weight / (1 + age_hours / 12)`. Sources without dates (GitHub Trending) use an assumed age of 12h.
  - **Cross-source boost:** a story's heat is multiplied by `1 + 0.5 × (sources − 1)`.
  - The constants live in a single config module so they can be tuned.
- **FR-14** Source cards keep each source's **native** ordering by default. A source may offer alternative orders (see `sort.<id>`), chosen per card in the Customize panel's Sort column. The card header then names the order (e.g. "Hacker News · momentum"), its info box explains it, and each order is cached separately.

### 6.4 Configuration via URL parameters

The URL is the only configuration. There are no cookies or storage. If parameters are missing, defaults apply, so a bare URL always works.

| Param | Example | Meaning | Default |
|---|---|---|---|
| `cards` | `cards=trending,hn,lobsters,github` | Which cards to show, **in this order** | All cards, default order |
| `n` | `n=20` | Items per card (global) | `20` |
| `n.<id>` | `n.hn=30&n.trending=40` | Per-card item count override | — |
| `sort.<id>` | `sort.hn=momentum` | Per-card sort order, for cards that offer one (currently Hacker News: `front` or `momentum`) | the card's default order |
| `window` | `window=12h` | Max item age (`6h`, `12h`, `24h`, `48h`, `7d`) | `24h` |

- **FR-15** Invalid or unknown values are ignored and the default is used. The page must never error because of bad parameters.
- **FR-16** Item counts are clamped between 5 and 50.
- **FR-17** A **Customize** panel on the page edits these settings. It is a plain HTML `<form method="get">`, so submitting it rewrites the URL with no JavaScript. Ordering uses up/down buttons or a numeric order field. Drag-and-drop may be added as optional JavaScript.
- **FR-18** Once configured, the user saves their view by bookmarking it. The Customize panel shows a "Copy link" button (optional JavaScript) and a short note explaining this.
- **FR-19** The parameters are canonicalized (stable key order, defaults omitted) so equivalent views share a URL and a CDN cache entry.

### 6.5 Failure handling

- **FR-20** A source that fails, times out (3 seconds) or returns garbage never breaks the page. Its card keeps the last good data, with the time of that original fetch, and marks it as not current by turning the card's time red (hovering it names the source that couldn't be reached). There is no notice text. Trending keeps that source's stories and its time turns red too, as does the top bar's "updated" time. The last good data is kept for 7 days in Vercel's Runtime Cache (shared by all function instances, via `@vercel/functions`), so a brand-new instance can still show it. Only a source with no data in that time shows "Unavailable right now". Times older than today also show the date.
- **FR-21** Trending is built from whichever sources succeeded.

### 6.6 PWA

- **FR-22** The app ships a web app manifest and icons so it can be installed to a home screen. A service worker is **not** required in v1.

## 7. Non-functional requirements

### 7.1 Performance budgets

| Metric | Budget |
|---|---|
| LCP (mid-range phone, 4G) | < 1.0s from a warm CDN cache |
| Client JavaScript | **< 15 KB gzipped** total; the page is fully usable with JS disabled |
| CSS | < 15 KB gzipped, inlined or one file |
| HTML (default view) | < 60 KB gzipped |
| Web fonts | None (system font stack) |
| Third-party requests from the browser | **Zero** |
| Lighthouse (mobile) | ≥ 95 Performance, 100 Accessibility, 100 Best Practices |

### 7.2 Freshness and caching

- **NFR-1** Source data is refreshed at most every **10 minutes**.
- **NFR-2** Vercel Hobby Cron only runs once a day, so freshness comes from **CDN caching with stale-while-revalidate** rather than cron:
  - Each source fetcher is cached for 10 minutes (`s-maxage=600, stale-while-revalidate=3600`).
  - Pages are server-rendered and cached at the edge per canonical URL with the same headers.
  - Users almost always get a cached response, and refreshes happen in the background.
- **NFR-3** Source fetches run in parallel with a 3-second timeout each.
- **NFR-4** The server sends a descriptive `User-Agent` (e.g. `scott-feed/1.0 (+https://github.com/<owner>/scott-feed)`) and respects each source's rate limits.

### 7.3 Privacy

- **NFR-5** No cookies, no client-side storage, no third-party scripts or embeds. The one exception to "no analytics" is **Vercel Web Analytics**: cookieless, anonymous page-view counts, added with the `@vercel/analytics` Astro component and loaded from the site's own domain (`/_vercel/insights/*`) in production builds only. Scripts must never be inlined, because the CSP blocks inline scripts.
- **NFR-6** No user data is collected or logged beyond Vercel's default request logs.

### 7.4 Accessibility

- **NFR-7** Semantic HTML (`<main>`, `<section>` per card with a heading, `<ol>` for ranked lists).
- **NFR-8** Fully usable with only a keyboard, with visible focus styles.
- **NFR-9** WCAG 2.2 AA color contrast in both themes.
- **NFR-10** Links that open in a new tab say so to screen readers (e.g. visually hidden "(opens in new tab)").
- **NFR-11** Respects `prefers-reduced-motion`.

### 7.5 Security

- **NFR-12** All external titles and text are escaped. No source HTML is rendered.
- **NFR-13** Only `http:` and `https:` item URLs are allowed; anything else is dropped.
- **NFR-14** A strict Content Security Policy (`default-src 'self'`; no inline scripts except hashed ones).
- **NFR-15** Optional API credentials (e.g. Reddit OAuth) come from environment variables only and are never committed. `.env.example` documents them.

### 7.6 Cost

- **NFR-16** Runs within Vercel Hobby limits and needs no paid APIs.

## 8. Architecture (recommended)

```
Browser ──GET /?cards=…&n=…──▶ Vercel Edge CDN (cached per canonical URL, SWR)
                                   │ miss / revalidate
                                   ▼
                          SSR page (Astro, server output)
                                   │ parallel, per-source cached
          ┌───────────┬────────────┼────────────┬───────────┐
          ▼           ▼            ▼            ▼           ▼
        HN API   Lobsters JSON  Reddit RSS  GitHub HTML  RSS feeds …
```

- **Framework:** **Astro** (TypeScript) with `@astrojs/vercel` in server output mode. It ships zero JavaScript by default, server-renders the page, and is easy for contributors. Small interactive extras (copy link, drag reorder) are optional `<script>` islands.
- **Source adapter contract:** each source is one module in `src/sources/<id>.ts` exporting:
  ```ts
  export interface Source {
    id: string;               // "hn"
    name: string;             // "Hacker News"
    homepage: string;
    hasScore: boolean;
    fetch(): Promise<Item[]>; // throws on failure
  }

  export interface Item {
    id: string;               // stable within source
    title: string;
    url: string;              // article URL
    discussionUrl?: string;
    score?: number;
    comments?: number;
    publishedAt: string;      // ISO 8601
    source: string;           // source id
  }
  ```
  A registry file lists sources in their default order. Adding a source means adding one module and one registry line.
- **Shared libraries:** `lib/rss.ts` (a tiny RSS/Atom parser), `lib/normalize-url.ts`, `lib/trending.ts`, `lib/params.ts` (parse, validate and canonicalize the URL configuration).
- **Testing:** Vitest unit tests for URL params, URL normalization, dedupe and trending scoring, plus fixture-based tests for each source parser (saved sample responses, no live network in CI).
- **CI:** GitHub Actions runs typecheck, lint, tests and build on every PR. Vercel preview deploys each PR.

## 9. Open-source / repo requirements

- **OSS-1** `README.md`: what it is, screenshot, live demo link, URL parameter reference, quick start, deploy-to-Vercel button, how to add a source.
- **OSS-2** `LICENSE` — MIT.
- **OSS-3** `CONTRIBUTING.md`: setup, scripts, coding conventions, the source adapter contract, PR checklist (tests, performance budget).
- **OSS-4** `CODE_OF_CONDUCT.md` (Contributor Covenant).
- **OSS-5** `.github/` with issue templates (bug report, **source request**), a PR template and a CI workflow.
- **OSS-6** `.env.example` listing any optional environment variables.
- **OSS-7** `CHANGELOG.md` in Keep a Changelog format; semantic versioning.
- **OSS-8** Every source module documents its endpoint, terms-of-use notes and rate limits in a header comment.
- **OSS-9** No secrets or personal data in the repo or its history.

## 10. Release plan

### v1 — today
- All 11 sources in section 5, with Reddit fault-tolerant.
- Source cards + Trending card with dedupe and heat ranking.
- URL configuration (`cards`, `n`, `n.<id>`, `window`) and a no-JavaScript Customize form.
- Responsive layout, mobile swipe, dark mode, PWA manifest.
- Edge caching with stale-while-revalidate, graceful failure.
- OSS docs, CI, unit tests.

### v1.1 — next
- Drag-and-drop reordering in the Customize panel.
- Reddit OAuth fallback if the unauthenticated feeds keep getting blocked.
- More sources based on community requests (e.g. Lemmy, Techmeme, Slashdot).

### Later / maybe
- Custom RSS through a URL parameter (`rss=<url>`), behind an allowlist or with careful SSRF protection.
- Keyword highlight and mute through URL parameters.
- Optional X/Twitter adapter for self-hosters with their own API key.

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Reddit blocks Vercel IPs | Reddit card empty | Graceful card failure; RSS first, then JSON; optional free OAuth app via env vars |
| GitHub Trending markup changes | Card breaks | Fixture tests catch parser drift; card degrades gracefully |
| Source rate limits | Temporary blank cards | 10-minute caching keeps request volume low regardless of traffic |
| Many URL parameter combinations fragment the CDN cache | More cold renders | Canonical params (FR-19); per-source data is cached separately, so a cold page render is still cheap |
| Source terms of use | Takedown / blocking | Use official APIs or RSS where available; link to originals, never republish content; descriptive User-Agent |
| Hobby tier limits | Throttling under traffic spikes | CDN caching serves almost all traffic without running functions |

## 12. Acceptance criteria (v1 done when…)

1. The deployed bare URL shows Trending plus all source cards with live data.
2. `?cards=hn,trending&n=10` shows only HN then Trending, 10 items each, and Trending includes only HN items.
3. Bad parameters (`?n=abc&cards=nope`) render the default view without errors.
4. Every item link and discussion link opens in a new tab.
5. If one source is forced to fail, its card shows the unavailable state and everything else renders.
6. The page works fully with JavaScript disabled.
7. Lighthouse mobile scores meet the budgets in 7.1. The Network tab shows no third-party requests, and the Application tab shows no cookies or storage.
8. A story present on HN and Lobsters appears once in Trending with both badges.
9. The repo includes the files in section 9 and CI passes.
