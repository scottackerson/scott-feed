/**
 * General news. Publisher RSS feeds offered for syndication, plus the largest
 * Reddit news communities. We show headlines and link to the original article.
 */
import { redditSource } from './reddit';
import { rssSource } from './rss';

export const nyt = rssSource({
  id: 'nyt',
  name: 'The New York Times',
  code: 'NYT',
  about: 'The New York Times is an American daily newspaper founded in 1851. This card follows its home page feed.',
  homepage: 'https://www.nytimes.com/',
  feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
});

export const npr = rssSource({
  id: 'npr',
  name: 'NPR',
  code: 'NPR',
  about: 'NPR (National Public Radio) is an American nonprofit public broadcaster founded in 1970.',
  homepage: 'https://www.npr.org/',
  feedUrl: 'https://feeds.npr.org/1001/rss.xml',
});

export const bbc = rssSource({
  id: 'bbc',
  name: 'BBC News',
  code: 'BBC',
  about: "BBC News is the news division of the British Broadcasting Corporation, the UK's public broadcaster.",
  homepage: 'https://www.bbc.com/news',
  feedUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
});

export const guardian = rssSource({
  id: 'guardian',
  name: 'The Guardian',
  code: 'GRD',
  about: 'The Guardian is a British daily newspaper founded in 1821. This card follows its world news feed.',
  homepage: 'https://www.theguardian.com/world',
  feedUrl: 'https://www.theguardian.com/world/rss',
});

export const cbs = rssSource({
  id: 'cbs',
  name: 'CBS News',
  code: 'CBS',
  about: 'CBS News is the news division of the American broadcast network CBS.',
  homepage: 'https://www.cbsnews.com/',
  feedUrl: 'https://www.cbsnews.com/latest/rss/main',
});

export const fox = rssSource({
  id: 'fox',
  name: 'Fox News',
  code: 'FOX',
  about: 'Fox News is an American cable news network launched in 1996.',
  homepage: 'https://www.foxnews.com/',
  feedUrl: 'https://moxie.foxnews.com/google-publisher/latest.xml',
});

export const aljazeera = rssSource({
  id: 'aljazeera',
  name: 'Al Jazeera',
  code: 'AJ',
  about: 'Al Jazeera is an international news network based in Doha, Qatar, founded in 1996.',
  homepage: 'https://www.aljazeera.com/',
  feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
});

export const redditNews = redditSource({
  id: 'redditnews',
  name: 'Reddit News',
  code: 'RDT',
  aboutCard: 'This card combines r/news and r/worldnews.',
  subreddits: ['news', 'worldnews'],
});
