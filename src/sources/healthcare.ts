/**
 * Healthcare industry and policy: payer, clinical, life sciences, regulation
 * and public health, roughly in that order.
 *
 * Public RSS feeds offered for syndication, plus the Federal Register's public
 * API, no key. Fetched at most every 10 minutes; we show headlines and link to
 * the original article.
 */
import { rssSource } from './rss';

export const healthcaredive = rssSource({
  id: 'healthcaredive',
  name: 'Healthcare Dive',
  code: 'HCD',
  about: 'Healthcare Dive is a trade publication covering health systems, payers and health policy.',
  homepage: 'https://www.healthcaredive.com/',
  feedUrl: 'https://www.healthcaredive.com/feeds/news/',
});

export const beckerspayer = rssSource({
  id: 'beckerspayer',
  name: "Becker's Payer Issues",
  code: 'BKP',
  about: "Becker's Payer Issues is a trade publication covering health insurers and the business of paying for care.",
  homepage: 'https://www.beckerspayer.com/',
  feedUrl: 'https://www.beckerspayer.com/feed/',
});

export const beckershospital = rssSource({
  id: 'beckershospital',
  name: "Becker's Hospital Review",
  code: 'BKH',
  about: "Becker's Hospital Review is a trade publication covering hospital operations, clinical leadership and health IT.",
  homepage: 'https://www.beckershospitalreview.com/',
  feedUrl: 'https://www.beckershospitalreview.com/feed/',
});

export const hitconsultant = rssSource({
  id: 'hitconsultant',
  name: 'HIT Consultant',
  code: 'HIT',
  about: 'HIT Consultant covers health information technology, digital health companies and deals.',
  homepage: 'https://hitconsultant.net/',
  feedUrl: 'https://hitconsultant.net/feed/',
});

export const histalk = rssSource({
  id: 'histalk',
  name: 'HIStalk',
  code: 'HIS',
  about: 'HIStalk is a long-running news and opinion site about healthcare information technology. It publishes only a few posts a day.',
  homepage: 'https://histalk2.com/',
  feedUrl: 'https://histalk2.com/feed/',
});

export const statnews = rssSource({
  id: 'statnews',
  name: 'STAT',
  code: 'STAT',
  about: 'STAT is a health, medicine and life sciences news site launched in 2015 by Boston Globe Media.',
  homepage: 'https://www.statnews.com/',
  feedUrl: 'https://www.statnews.com/feed/',
});

export const medcity = rssSource({
  id: 'medcity',
  name: 'MedCity News',
  code: 'MCN',
  about: 'MedCity News covers the business of healthcare, including providers, payers, digital health and biopharma.',
  homepage: 'https://medcitynews.com/',
  feedUrl: 'https://medcitynews.com/feed/',
});

export const biopharmadive = rssSource({
  id: 'biopharmadive',
  name: 'BioPharma Dive',
  code: 'BPD',
  about: 'BioPharma Dive is a trade publication covering drug development, biotech and the pharmaceutical industry.',
  homepage: 'https://www.biopharmadive.com/',
  feedUrl: 'https://www.biopharmadive.com/feeds/news/',
});

export const pharmavoice = rssSource({
  id: 'pharmavoice',
  name: 'PharmaVoice',
  code: 'PV',
  about: 'PharmaVoice is a trade publication covering the business and leadership of the life sciences industry.',
  homepage: 'https://www.pharmavoice.com/',
  feedUrl: 'https://www.pharmavoice.com/feeds/news/',
});

export const clinicaltrials = rssSource({
  id: 'clinicaltrials',
  name: 'Clinical Trials Arena',
  code: 'CTA',
  about: 'Clinical Trials Arena is a trade publication covering clinical research and trial results.',
  homepage: 'https://www.clinicaltrialsarena.com/',
  feedUrl: 'https://www.clinicaltrialsarena.com/feed/',
});

export const cmsRules = rssSource({
  id: 'cmsrules',
  name: 'CMS in the Federal Register',
  code: 'CMS',
  about:
    'The Federal Register is the US government\'s daily journal of rules and notices. This card lists documents from the Centers for Medicare & Medicaid Services.',
  homepage: 'https://www.federalregister.gov/agencies/centers-for-medicare-medicaid-services',
  feedUrl:
    'https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=centers-for-medicare-medicaid-services',
});

export const fda = rssSource({
  id: 'fda',
  name: 'FDA Press Releases',
  code: 'FDA',
  about: 'Press announcements from the US Food and Drug Administration. Volume is low, so this card is often empty in short time windows.',
  homepage: 'https://www.fda.gov/news-events/fda-newsroom/press-announcements',
  feedUrl: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml',
});

export const kff = rssSource({
  id: 'kff',
  name: 'KFF Health News',
  code: 'KFF',
  about: 'KFF Health News is a nonprofit newsroom covering health policy, public health and the US healthcare system.',
  homepage: 'https://kffhealthnews.org/',
  feedUrl: 'https://kffhealthnews.org/feed/',
});
