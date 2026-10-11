import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
const APP = readFileSync('/tmp/app-iife.js', 'utf8');
const RATES = {
  tolaSale: 4440, tolaPurchase: 4262, g10Sale: 3806.5, g10Purchase: 3654,
  gold: { tolaSale: 296500, tolaPurchase: 284640, g10Sale: 254200, g10Purchase: 244035, carat: 24, purchaseDerived: false },
  source: 'KAGOSIDA', via: 'kagosida.org.np',
};
async function boot(page, url, payload = RATES) {
  const dom = new JSDOM(readFileSync(page, 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, url,
    beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} }); } });
  const { window } = dom;
  window.scrollTo = () => {};
  window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
  window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
  window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform(){}, clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, fill(){},
    createLinearGradient:()=>({addColorStop(){}}), createRadialGradient:()=>({addColorStop(){}}),
    drawImage(){}, save(){}, restore(){}, translate(){}, rotate(){}, stroke(){}, moveTo(){}, lineTo(){},
    measureText:()=>({width:10}), fillText(){}, closePath(){}, ellipse(){}, setLineDash(){}, arcTo(){} });
  const errs = []; window.addEventListener('error', e => errs.push(e.message || String(e.error)));
  window.eval(APP);
  await new Promise(r => setTimeout(r, 800));
  return { d: window.document, errs };
}
let ok = true;
const c = (l, v) => { ok &&= v; console.log(`${v ? 'PASS ' : 'FAIL '} ${l}`); };

const { d, errs } = await boot('dist/home/index.html', 'https://dppl.com.np/home');
const t = d.getElementById('root').textContent.replace(/\s+/g, ' ');

c('card titled for both metals', /Today.s Gold & Silver Price/.test(t));
c('gold block present', /Gold 24K/.test(t));
c('silver block present', /Silver 999/.test(t));
for (const v of ['2,96,500', '296,500']) if (t.includes(v)) console.log(`   gold tola sale rendered as ${v}`);
c('gold figures shown', /2,?96,?500/.test(t) && /2,?54,?200/.test(t));
c('gold buy-back shown', /2,?84,?640/.test(t));
c('silver figures shown', t.includes('4,440') && t.includes('3,806.50'));
c('new logo used', !!d.querySelector('img[src*="logo-gold"]'));
c('no old logo anywhere', !d.querySelector('img[src="/images/logo.webp"]'));
c('hero mentions both metals', /gold & silver price/i.test(t));
c('gold launch panel present', /24-carat gold, now at the counter/.test(t));
c('October 2026 dated', /October 2026/.test(t));
c('gold FAQ added', /Do you sell gold as well as silver\?/.test(t));
c('24 vs 22 carat explained', /difference between 24-carat and 22-carat/.test(t));
console.log('errors:', errs.length ? errs : 'none');
ok &&= errs.length === 0;

// a silver-only board must not leave an empty gold block
const silverOnly = { ...RATES, gold: null };
const s2 = await boot('dist/home/index.html', 'https://dppl.com.np/home', silverOnly);
const t2 = s2.d.getElementById('root').textContent.replace(/\s+/g, ' ');
c('gold block hidden when the board has no gold', !/Gold 24K/.test(t2) && /Silver 999/.test(t2));
if (!ok) process.exit(1);
console.log('\nGOLD + SILVER CARD, NEW LOGO AND CONTENT ALL CORRECT');
