import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import icon from "astro-icon";
import breaks from 'remark-breaks'; /* i shouldnt need to use a PLUGIN just to properly do a hard break ffs */
import rehype from 'remark-rehype';
import slug from 'rehype-slug';
import toc from 'rehype-toc';

export default defineConfig({
  integrations: [icon()],
  markdown: {
    processor: unified({remarkPlugins: [breaks, rehype, slug, [toc, {
      customizeTOC(toc) {
      const hasEntries =
        toc.children?.some(
          child =>
            child.tagName === 'ol' &&
            child.children?.length
        );
      if (hasEntries) {
        return {
          type: 'element', tagName: 'div', properties: {
          className: ['box']
        }, children: [
            { type: 'element', tagName: 'h2', properties: {className: ['section']}, children: [{ type: 'text', value: 'In this article...' }]},
            toc
          ]
        }
      } else {
        return null;
      }
}
    }]],
  }),
  }
});
