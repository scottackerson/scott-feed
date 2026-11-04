/**
 * Simon Willison's Weblog — everything feed (posts, links, notes, releases).
 * Endpoint: https://simonwillison.net/atom/everything/ — public Atom, no key.
 */
import { rssSource } from './rss';

export default rssSource({
  id: 'simonw',
  name: 'Simon Willison',
  code: 'SIMON',
  about:
    "Simon Willison's Weblog is the blog of a co-creator of the Django web framework and creator of Datasette. He writes several times a day about LLMs, AI tools and building software with them.",
  homepage: 'https://simonwillison.net/',
  feedUrl: 'https://simonwillison.net/atom/everything/',
});
