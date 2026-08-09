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
const { render, renderPrivacy, renderTerms } = require('./.prerender.cjs');

const shell = readFileSync('dist/index.html', 'utf8');

const write = (file, html) => {
  writeFileSync(file, shell.replace('<div id="root"></div>', `<div id="root"><div data-prerender>${html}</div></div>`));
  console.log(`  ${file} — ${(html.length / 1024).toFixed(1)} KB static`);
};

// legal pages get their own title, description and canonical
const legal = (file, html, title, description, canonical) => {
  let out = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace('<div id="root"></div>', `<div id="root"><div data-prerender>${html}</div></div>`);
  writeFileSync(file, out);
  console.log(`  ${file} — ${(html.length / 1024).toFixed(1)} KB static`);
};

console.log('prerendering:');
write('dist/index.html', render());

mkdirSync('dist/privacy', { recursive: true });
legal(
  'dist/privacy/index.html',
  renderPrivacy(),
  'Privacy Policy — DPPL, New Road, Kathmandu',
  'How DPPL handles cookies, Google advertising, analytics and enquiry information on dppl.com.np.',
  'https://dppl.com.np/privacy/'
);

mkdirSync('dist/terms', { recursive: true });
legal(
  'dist/terms/index.html',
  renderTerms(),
  'Terms of Use — DPPL, New Road, Kathmandu',
  'Terms governing use of dppl.com.np, including how published silver rates and making charges apply.',
  'https://dppl.com.np/terms/'
);


// Each menu item is a real URL (/home, /products, ...). They serve the same
// single-page content, so every one canonicalises back to the root to keep
// Google from treating them as duplicate pages.
const SECTIONS = [
  ['home', "DPPL — Today's Silver Price in Nepal | Silver Bars & Grains, New Road, Kathmandu"],
  ['products', 'Silver Bars & Grains — 999 Fine | DPPL, New Road, Kathmandu'],
  ['articles', 'Silver Journal — History, Buying & Investing | DPPL Kathmandu'],
  ['about', 'About DPPL — Silver Bullion Dealer, New Road, Kathmandu'],
  ['contact', 'Contact DPPL — Sasa Complex, New Road, Kathmandu'],
];

const home = render();
for (const [slug, title] of SECTIONS) {
  mkdirSync(`dist/${slug}`, { recursive: true });
  const out = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace('<div id="root"></div>', `<div id="root"><div data-prerender>${home}</div></div>`);
  writeFileSync(`dist/${slug}/index.html`, out);
  console.log(`  dist/${slug}/index.html — section page`);
}

rmSync('scripts/.prerender.cjs');
