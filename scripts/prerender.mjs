import { buildSync } from 'esbuild';
import { readFileSync, writeFileSync, rmSync } from 'fs';
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
const { render } = require('./.prerender.cjs');
const html = render();

const file = 'dist/index.html';
let out = readFileSync(file, 'utf8');
out = out.replace(
  '<div id="root"></div>',
  `<div id="root"><div data-prerender>${html}</div></div>`
);
writeFileSync(file, out);
rmSync('scripts/.prerender.cjs');
console.log(`prerender injected: ${(html.length / 1024).toFixed(1)} KB of static content in dist/index.html`);
