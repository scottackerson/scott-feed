/**
 * Publisher RSS feeds. Each is a public feed offered by the publisher for
 * syndication; we show headlines and link to the original article.
 */
import { rssSource } from './rss';

export const techcrunch = rssSource({
  id: 'techcrunch',
  name: 'TechCrunch',
  code: 'TC',
  about:
    'TechCrunch is a technology news publication founded in 2005, best known for its coverage of startups, funding rounds and venture capital.',
  homepage: 'https://techcrunch.com/',
  feedUrl: 'https://techcrunch.com/feed/',
});

export const verge = rssSource({
  id: 'verge',
  name: 'The Verge',
  code: 'VRG',
  about:
    'The Verge is a technology and culture news site launched by Vox Media in 2011, covering gadgets, science, entertainment and tech policy.',
  homepage: 'https://www.theverge.com/',
  feedUrl: 'https://www.theverge.com/rss/index.xml',
});

export const newstack = rssSource({
  id: 'newstack',
  name: 'The New Stack',
  code: 'TNS',
  about:
    'The New Stack is a news and analysis site for software engineers, covering cloud native infrastructure, DevOps, developer tools and AI engineering.',
  homepage: 'https://thenewstack.io/',
  feedUrl: 'https://thenewstack.io/feed/',
});

export const ars = rssSource({
  id: 'ars',
  name: 'Ars Technica',
  code: 'ARS',
  about:
    'Ars Technica is a technology news and analysis site founded in 1998 and owned by Condé Nast, known for in-depth coverage of science, IT and tech policy.',
  homepage: 'https://arstechnica.com/',
  feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
});
