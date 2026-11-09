/**
 * US politics, balanced on purpose: three left-leaning outlets, three
 * right-leaning outlets and nonpartisan political coverage. Keep the left and
 * right counts equal, and at the same Trending weight, so neither side
 * dominates. Each card's info box states the outlet's lean.
 *
 * Public RSS feeds offered for syndication, no key. Fetched at most every 10
 * minutes; we show headlines and link to the original article.
 */
import { getText } from '../lib/http';
import type { Source } from '../lib/types';
import { rssSource } from './rss';
import { parse as parseMemeFeed } from './techmeme';

export const memeorandum: Source = {
  id: 'memeorandum',
  name: 'Memeorandum',
  code: 'MEME',
  about:
    "Memeorandum is a political news summary from the makers of Techmeme. It picks the day's most discussed political stories from outlets across the spectrum and groups related coverage together.",
  homepage: 'https://www.memeorandum.com/',
  hasScore: false,
  // Curated, so a stronger signal than a plain publisher feed (as with Techmeme).
  trendingWeight: 0.7,
  sortDescription:
    "Newest first, as listed in Memeorandum's feed. The comments link opens Memeorandum's page with related coverage.",
  fetch: async () => parseMemeFeed(await getText('https://www.memeorandum.com/feed.xml'), 'memeorandum'),
};

export const politico = rssSource({
  id: 'politico',
  lean: 'center',
  name: 'Politico',
  code: 'POL',
  about: 'Politico is a Washington-focused political news organization founded in 2007. Generally regarded as centrist or nonpartisan.',
  homepage: 'https://www.politico.com/',
  feedUrl: 'https://rss.politico.com/politics-news.xml',
});

export const thehill = rssSource({
  id: 'thehill',
  lean: 'center',
  name: 'The Hill',
  code: 'HILL',
  about: 'The Hill is a Washington news outlet covering Congress, the White House and campaigns. Generally regarded as centrist or nonpartisan.',
  homepage: 'https://thehill.com/',
  feedUrl: 'https://thehill.com/homenews/feed/',
});

export const rollcall = rssSource({
  id: 'rollcall',
  lean: 'center',
  name: 'Roll Call',
  code: 'RC',
  about: 'Roll Call is a newspaper and website covering the US Congress, founded in 1955. Generally regarded as nonpartisan.',
  homepage: 'https://rollcall.com/',
  feedUrl: 'https://rollcall.com/feed/',
});

export const guardianPolitics = rssSource({
  id: 'guardianpolitics',
  lean: 'left',
  name: 'Guardian US Politics',
  code: 'GRD',
  about: "This card follows The Guardian's US politics coverage. The British newspaper is generally regarded as left-leaning.",
  homepage: 'https://www.theguardian.com/us-news/us-politics',
  feedUrl: 'https://www.theguardian.com/us-news/us-politics/rss',
});

export const motherjones = rssSource({
  id: 'motherjones',
  lean: 'left',
  name: 'Mother Jones',
  code: 'MJ',
  about: 'Mother Jones is a nonprofit American magazine known for investigative reporting. Generally regarded as left-leaning.',
  homepage: 'https://www.motherjones.com/politics/',
  feedUrl: 'https://www.motherjones.com/politics/feed/',
});

export const thenation = rssSource({
  id: 'thenation',
  lean: 'left',
  name: 'The Nation',
  code: 'NAT',
  about: 'The Nation is an American magazine of politics and culture founded in 1865. Generally regarded as left-leaning.',
  homepage: 'https://www.thenation.com/',
  feedUrl: 'https://www.thenation.com/feed/?post_type=article',
});

export const foxPolitics = rssSource({
  id: 'foxpolitics',
  lean: 'right',
  name: 'Fox News Politics',
  code: 'FOX',
  about: "This card follows Fox News's politics coverage. The American cable network is generally regarded as right-leaning.",
  homepage: 'https://www.foxnews.com/politics',
  feedUrl: 'https://moxie.foxnews.com/google-publisher/politics.xml',
});

export const nationalreview = rssSource({
  id: 'nationalreview',
  lean: 'right',
  name: 'National Review',
  code: 'NR',
  about: 'National Review is an American magazine of news and opinion founded in 1955. Generally regarded as right-leaning.',
  homepage: 'https://www.nationalreview.com/',
  feedUrl: 'https://www.nationalreview.com/feed/',
});

export const examiner = rssSource({
  id: 'examiner',
  lean: 'right',
  name: 'Washington Examiner',
  code: 'WEX',
  about: 'The Washington Examiner is an American news and opinion outlet based in Washington, DC. Generally regarded as right-leaning.',
  homepage: 'https://www.washingtonexaminer.com/',
  feedUrl: 'https://www.washingtonexaminer.com/feed/',
});
