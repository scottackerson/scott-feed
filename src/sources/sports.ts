/**
 * Major-league sports headlines. Public RSS feeds offered for syndication, no
 * key. Fetched at most every 10 minutes; we show headlines and link to the
 * original article.
 *
 * CBS Sports is left out on purpose: its feed mixes in sportsbook promo posts.
 */
import { rssSource } from './rss';

const espn = (id: string, name: string, code: string, league: string, path: string) =>
  rssSource({
    id,
    name,
    code,
    publisher: 'espn',
    about: `ESPN is an American sports media company. This card follows its ${league} headlines.`,
    homepage: `https://www.espn.com/${path}/`,
    feedUrl: `https://www.espn.com/espn/rss/${path}/news`,
  });

export const espnTop = rssSource({
  id: 'espn',
  name: 'ESPN',
  code: 'ESPN',
  publisher: 'espn',
  about: 'ESPN is an American sports media company. This card follows its top headlines.',
  homepage: 'https://www.espn.com/',
  feedUrl: 'https://www.espn.com/espn/rss/news',
});

export const espnNfl = espn('nfl', 'NFL', 'NFL', 'NFL', 'nfl');
export const espnNba = espn('nba', 'NBA', 'NBA', 'NBA', 'nba');
export const espnMlb = espn('mlb', 'MLB', 'MLB', 'MLB', 'mlb');
export const espnNhl = espn('nhl', 'NHL', 'NHL', 'NHL', 'nhl');
export const espnSoccer = espn('soccer', 'Soccer', 'SOC', 'soccer', 'soccer');

export const yahooSports = rssSource({
  id: 'yahoosports',
  name: 'Yahoo Sports',
  code: 'YS',
  about: 'Yahoo Sports is a sports news site covering the major American leagues and more.',
  homepage: 'https://sports.yahoo.com/',
  feedUrl: 'https://sports.yahoo.com/rss/',
});

export const bbcSport = rssSource({
  id: 'bbcsport',
  name: 'BBC Sport',
  code: 'BBC',
  about: "BBC Sport is the sports division of the UK's public broadcaster.",
  homepage: 'https://www.bbc.com/sport',
  feedUrl: 'https://feeds.bbci.co.uk/sport/rss.xml',
});

export const guardianSport = rssSource({
  id: 'guardiansport',
  name: 'Guardian Sport',
  code: 'GRD',
  about: "This card follows the sports coverage of The Guardian, a British daily newspaper.",
  homepage: 'https://www.theguardian.com/sport',
  feedUrl: 'https://www.theguardian.com/sport/rss',
});
