import { buildSync } from 'esbuild';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { createRequire } from 'module';

buildSync({
  entryPoints: ['scripts/prerender-entry.jsx'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.css': 'empty' },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  outfile: 'scripts/.prerender.cjs',
  logLevel: 'error',
});

const require = createRequire(import.meta.url);
const { render, renderPrivacy, renderTerms, renderJournal, renderArticle, renderNotFound, renderAbout, renderContact, renderProducts, renderRates, articles, faqs } = require('./.prerender.cjs');

let shell = readFileSync('dist/index.html', 'utf8');

// inline the site stylesheet so first paint needs no extra round trip
const cssLink = shell.match(/<link rel="stylesheet"[^>]*href="(\/assets\/index-[^"]+\.css)"[^>]*>/);
if (cssLink) {
  const css = readFileSync(`dist${cssLink[1]}`, 'utf8');
  shell = shell.replace(cssLink[0], `<style>${css}</style>`);
  console.log(`inlined ${(css.length / 1024).toFixed(1)} KB of CSS into the shell`);
}

const SITE = 'https://dppl.com.np';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ldjson = (o) => `    <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>\n`;
const ORG = { '@type': 'Organization', '@id': `${SITE}/#business`, name: 'Diamond Palace Pvt. Ltd.', url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png`, width: 512, height: 512 } };

/* Every page gets a complete head of its own. Previously only the title,
   description and canonical were swapped, so each article quietly carried the
   homepage's og:url, its FAQ and its product markup. */
const metaBlock = ({ title, description, canonical, type = 'website', robots = 'index,follow,max-image-preview:large', keywords }) => {
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : null,
    canonical ? `<link rel="canonical" href="${canonical}" />` : null,
    `<meta name="robots" content="${robots}" />`,
    `<meta property="og:type" content="${type}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : null,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE}/og-image.jpg" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ].filter(Boolean);
  return '<!--page-meta-->\n    ' + lines.join('\n    ') + '\n    <!--/page-meta-->';
};

const emit = (file, body, meta, { home = false, schema = [] } = {}) => {
  let out = shell.replace(/<!--page-meta-->[\s\S]*?<!--\/page-meta-->/, metaBlock(meta));
  if (!home) out = out.replace(/[ \t]*<!--home-schema-->[\s\S]*?<!--\/home-schema-->\n?/, '');
  if (schema.length) out = out.replace('</head>', schema.map(ldjson).join('') + '  </head>');
  out = out.replace('<div id="root"></div>', `<div id="root"><div data-prerender>${body}</div></div>`);
  writeFileSync(file, out);
  console.log(`  ${file}`);
};

/* Files are written flat — privacy.html, not privacy/index.html. Cloudflare
   Pages serves a folder index at /privacy/ and 308-redirects /privacy to it,
   so a folder build made every slash-less canonical URL a redirect, and every
   slashed copy a duplicate pointing back at it. A flat file is served at the
   bare path, which is exactly the canonical. */
// The FAQ markup is generated from the same array the page renders, so the
// two can never drift apart — Google requires FAQ markup to match visible text.
const plain = (t) => String(t).replace(/<[^>]+>/g, '');
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: plain(f.q),
    acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
  })),
};
shell = shell.replace(/[ \t]*<script type="application\/ld\+json">\s*\{"@context": "https:\/\/schema\.org", "@type": "FAQPage"[\s\S]*?<\/script>\n?/, ldjson(faqLd));
if (!shell.includes('"@type":"FAQPage"')) throw new Error('FAQ schema was not replaced');

console.log('prerendering:');
const homeKeywords = (shell.match(/<meta name="keywords" content="([^"]*)"/) || [])[1];
emit('dist/index.html', render(), {
  title: "Gold & Silver Bullion in Kathmandu — 999.9 Gold Bars, 999 Silver | Today's Price | Diamond Palace Pvt. Ltd.",
  description: "24-carat gold bars and 999 fine silver bars, coins and grains from Diamond Palace Pvt. Ltd. (DPPL), a gold and silver bullion dealer on New Road, Kathmandu — weighed in front of you and invoiced to the gram. Today's gold and silver price per tola and 10 gram, and itemised quotations online. आजको सुन चाँदीको मूल्य।",
  canonical: `${SITE}/`,
  keywords: homeKeywords && homeKeywords.replace(/&amp;/g, '&'),
}, { home: true });

emit('dist/privacy.html', renderPrivacy(), {
  title: 'Privacy Policy | Diamond Palace Pvt. Ltd., New Road, Kathmandu',
  description: 'How Diamond Palace Pvt. Ltd. handles cookies, Google advertising, analytics and enquiry information on dppl.com.np.',
  canonical: `${SITE}/privacy`,
});

emit('dist/terms.html', renderTerms(), {
  title: 'Terms of Use | Diamond Palace Pvt. Ltd., New Road, Kathmandu',
  description: 'Terms governing use of dppl.com.np, including how the published gold and silver rates and making charges apply.',
  canonical: `${SITE}/terms`,
});

emit('dist/articles.html', renderJournal(), {
  title: 'Gold & Silver Journal — History, Pricing & Buying Guides | Diamond Palace Pvt. Ltd.',
  description: 'Writing from a bullion counter on New Road: the history of gold and silver, gold in Nepal, how prices are set, how to verify a bar, and how to buy without being overcharged.',
  canonical: `${SITE}/articles`,
}, {
  schema: [{
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE}/articles#blog`,
    name: 'The Diamond Palace Journal',
    url: `${SITE}/articles`,
    inLanguage: 'en',
    publisher: ORG,
    blogPost: articles.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      url: `${SITE}/articles/${a.slug}`,
    })),
  }],
});

mkdirSync('dist/articles', { recursive: true });
for (const a of articles) {
  const url = `${SITE}/articles/${a.slug}`;
  emit(`dist/articles/${a.slug}.html`, renderArticle(a.slug), {
    title: `${a.title} | Diamond Palace Pvt. Ltd.`,
    description: a.description,
    canonical: url,
    type: 'article',
  }, {
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: a.title,
        description: a.description,
        image: [`${SITE}/og-image.jpg`, `${SITE}/icon-512.png`],
        datePublished: a.date,
        dateModified: a.date,
        articleSection: a.category,
        inLanguage: 'en',
        author: ORG,
        publisher: ORG,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE}/articles` },
          { '@type': 'ListItem', position: 3, name: a.title, item: url },
        ],
      },
    ],
  });
}

// Standalone pages: products, today's rate, about, contact
const crumbs = (name, url) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name, item: url },
  ],
});
const PAGES = [
  ['about', renderAbout, 'AboutPage', 'About us',
    'About Diamond Palace Pvt. Ltd. | Gold & Silver Bullion Dealer, New Road, Kathmandu',
    'Diamond Palace Pvt. Ltd., established 2080 B.S., sells 24-carat gold bars and 999 fine silver by weight from Sasa Complex, New Road, Kathmandu. How buying, invoicing and buy-back work.'],
  ['contact', renderContact, 'ContactPage', 'Contact',
    'Contact & Directions | Diamond Palace Pvt. Ltd., Sasa Complex, New Road, Kathmandu',
    'Visit Diamond Palace Pvt. Ltd. at 5th Floor, Sasa Complex, New Road, Kathmandu. Open Sunday to Friday, 10:30 to 18:00. Call 01-5915052 or WhatsApp +977 9805617932.'],
  ['products', renderProducts, 'CollectionPage', 'Products',
    'Gold & Silver Bullion — 999.9 Gold Bars, 999 Silver Bars, Coins & Grains | Diamond Palace Pvt. Ltd.',
    '24-carat gold bars of 5 g, 10 g and 1 tola, raw gold for business, and 999 fine silver bars of 100 g, 500 g and 1000 g, silver coins and grains, sold by weight at New Road, Kathmandu.'],
  ['rates', renderRates, 'WebPage', 'Today’s rate',
    'Today’s Gold & Silver Price in Nepal — Per Tola & 10 Gram | Diamond Palace Pvt. Ltd.',
    'Today’s 24-carat gold and 999 fine silver selling and buying rates in Nepal, per tola and per 10 grams, with a daily record of past rates. आजको सुन चाँदीको मूल्य।'],
];
for (const [slug, fn, type, crumb, title, description] of PAGES) {
  const url = `${SITE}/${slug}`;
  emit(`dist/${slug}.html`, fn(), { title, description, canonical: url }, {
    schema: [
      { '@context': 'https://schema.org', '@type': type, '@id': `${url}#page`, url, name: title, description, inLanguage: 'en', isPartOf: { '@type': 'WebSite', url: `${SITE}/`, name: 'Diamond Palace Pvt. Ltd.' }, about: { '@id': `${SITE}/#business` } },
      crumbs(crumb, url),
    ],
  });
}

// served with a 404 status by Cloudflare; never canonical, never indexed
emit('dist/404.html', renderNotFound(), {
  title: 'Page not found | Diamond Palace Pvt. Ltd.',
  description: 'That page could not be found. Browse today’s gold and silver price, our bullion, or the Diamond Palace Journal.',
  canonical: null,
  robots: 'noindex,follow',
});

rmSync('scripts/.prerender.cjs');
