/**
 * Publisher RSS feeds. Each is a public feed offered by the publisher for
 * syndication; we show headlines and link to the original article.
 */
import { rssSource } from './rss';

export const techcrunch = rssSource('techcrunch', 'TechCrunch', 'TC', 'https://techcrunch.com/', 'https://techcrunch.com/feed/');
export const verge = rssSource('verge', 'The Verge', 'VRG', 'https://www.theverge.com/', 'https://www.theverge.com/rss/index.xml');
export const ars = rssSource(
  'ars',
  'Ars Technica',
  'ARS',
  'https://arstechnica.com/',
  'https://feeds.arstechnica.com/arstechnica/index',
);
