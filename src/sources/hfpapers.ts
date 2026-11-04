/**
 * Hugging Face Daily Papers — AI research papers the community is upvoting.
 * Endpoint: https://huggingface.co/api/daily_papers — public JSON, no key.
 * Links go to the arXiv abstract; the Hugging Face paper page is the
 * discussion link.
 */
import { getJson } from '../lib/http';
import type { Item, Source } from '../lib/types';

interface DailyPaper {
  paper: { id: string; title: string; upvotes?: number; submittedOnDailyAt?: string; publishedAt?: string };
  publishedAt?: string;
  numComments?: number;
}

export function parse(data: DailyPaper[]): Item[] {
  return (Array.isArray(data) ? data : [])
    .filter((d) => d?.paper?.id && d.paper.title)
    .map((d) => ({
      id: d.paper.id,
      title: d.paper.title.replace(/\s+/g, ' ').trim(),
      url: `https://arxiv.org/abs/${d.paper.id}`,
      discussionUrl: `https://huggingface.co/papers/${d.paper.id}`,
      score: d.paper.upvotes ?? 0,
      comments: d.numComments ?? 0,
      publishedAt: d.paper.submittedOnDailyAt ?? d.publishedAt ?? d.paper.publishedAt ?? '',
      source: 'hfpapers',
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

const source: Source = {
  id: 'hfpapers',
  name: 'HF Daily Papers',
  code: 'HFP',
  about:
    "Daily Papers is Hugging Face's daily list of new AI research papers, mostly from arXiv, submitted by the community and voted on by Hugging Face users.",
  homepage: 'https://huggingface.co/papers',
  hasScore: true,
  scoreLabel: 'upvotes',
  // Research papers are a different kind of item; keep them from crowding Trending.
  trendingWeight: 0.6,
  sortDescription:
    "Most upvoted first among today's papers, like the Hugging Face Daily Papers page. Titles link to the arXiv abstract; the comments link opens the Hugging Face discussion.",
  fetch: async () => parse(await getJson('https://huggingface.co/api/daily_papers')),
};
export default source;
