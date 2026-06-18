import { cfg } from "../config";
import rss from '@astrojs/rss';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeToc from 'rehype-toc';

export async function GET() {
  const name = cfg.shortname || cfg.name;

  const posts = import.meta.glob('../pages/blog/*.md', { eager: true });

  const typedPosts = Object.values(posts).map((postModule) => postModule);

  const items = typedPosts.map((postModule) => {
    const { frontmatter, rawContent, url } = postModule;
    const { title, date, desc } = frontmatter;
    const body = rawContent();

    if (!body || typeof body !== 'string') {
      return null;
    }

  const content = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeStringify)
  .use(rehypeToc, {
    customizeTOC(toc) {
      const hasEntries =
        toc.children?.some(
          child =>
            child.tagName === 'ol' &&
            child.children?.length
        );
      if (hasEntries) {
        return {
          type: 'element', tagName: 'div', children: [
            { type: 'element', tagName: 'b', children: [{ type: 'text', value: 'In this article...' }]},
            toc
          ]
        }
      } else {
        return null;
      }
    }
  })
  .processSync(body)
  .toString();

    return {
      title,
      pubDate: date,
      description: desc || 'No description available',
      link: url,
      author: cfg.name,
      content: content,
    };
  }).filter(Boolean);

  return rss({
    title: `${name} Informational Panel`,
    description: `The official ${cfg.name} blog`,
    site: `http://${cfg.domain}`,
    items,
  });
}