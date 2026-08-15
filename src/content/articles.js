import { PART_ONE } from './articles-part1.js';
import { PART_TWO } from './articles-part2.js';

// reading order: history first, then buying, owning and investing
export const ARTICLES = [...PART_ONE, ...PART_TWO];

export const bySlug = (slug) => ARTICLES.find((a) => a.slug === slug);

export const wordCount = (a) =>
  a.blocks.reduce((n, b) => {
    const text = b.p || b.h || b.note || (b.ul ? b.ul.join(' ') : '');
    return n + text.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  }, 0);
