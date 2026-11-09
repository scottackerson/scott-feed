/**
 * 3D printing: industry news plus the hobbyist Reddit communities. Public RSS
 * feeds offered for syndication, no key. Fetched at most every 10 minutes; we
 * show headlines and link to the original article.
 */
import { redditSource } from './reddit';
import { rssSource } from './rss';

export const threedprint = rssSource({
  id: '3dprintcom',
  name: '3DPrint.com',
  code: '3DP',
  about: '3DPrint.com is a news site covering the additive manufacturing industry.',
  homepage: 'https://3dprint.com/',
  feedUrl: 'https://3dprint.com/feed/',
});

export const printingIndustry = rssSource({
  id: '3dpi',
  name: '3D Printing Industry',
  code: '3DPI',
  about: '3D Printing Industry is a news site covering additive manufacturing companies, research and applications.',
  homepage: 'https://3dprintingindustry.com/',
  feedUrl: 'https://3dprintingindustry.com/feed/',
});

export const tct = rssSource({
  id: 'tct',
  name: 'TCT Magazine',
  code: 'TCT',
  about: 'TCT Magazine is a trade publication covering 3D printing and additive manufacturing technology.',
  homepage: 'https://www.tctmagazine.com/',
  feedUrl: 'https://www.tctmagazine.com/feed/',
});

export const reddit3d = redditSource({
  id: 'reddit3d',
  name: 'Reddit 3D Printing',
  code: 'RDT',
  aboutCard: 'This card combines r/3Dprinting and r/functionalprint, where hobbyists share prints, problems and useful designs.',
  subreddits: ['3Dprinting', 'functionalprint'],
});
