import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { d } from "../config";

const parser = new MarkdownIt({
  html: true
});
const site = import.meta.env.SITE;

function makeImageSrcAbsolute(html, siteOrigin) {
  return html.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/g, (match, src) => {
    if (src.startsWith('http') || src.startsWith('//')) {
      return match;
    }

    const cleanedSrc = src.replace(/(\.\.\/)+public\//, '');
    const path = cleanedSrc.startsWith('/') ? cleanedSrc : '/' + cleanedSrc;
    const absoluteSrc = new URL(path, siteOrigin).href;
    return match.replace(src, absoluteSrc);
  });
}

export async function GET() {
  const posts = import.meta.glob('../pages/blog/*.md', { eager: true });

  const typedPosts = Object.values(posts).map((postModule) => postModule);

  typedPosts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });

  const items = typedPosts.map((postModule) => {
    const { frontmatter, rawContent, url } = postModule;
    const { title, date, desc } = frontmatter;
    const body = rawContent();

    if (!body || typeof body !== 'string') {
      return null;
    }

    const htmlContent = parser.render(body);

    const sanitizedContent = sanitizeHtml(htmlContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
      },
    });

    const contentWithAbsoluteImages = makeImageSrcAbsolute(sanitizedContent, site);

    return {
      title,
      pubDate: date,
      description: desc || 'No description available',
      link: `${site}${url}`,
      author: `${d.name}`,
      content: contentWithAbsoluteImages,
    };
  }).filter(Boolean);

  return rss({
    title: `${d.shortname}'s Blog`,
    description: `${d.shortname}'s space to ramble about various things`,
    site,
    items,
  });
}