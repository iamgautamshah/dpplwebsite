import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
const APP = readFileSync('/tmp/app.js', 'utf8');
const RATES = {
  tolaSale: 4440, tolaPurchase: 4262, g10Sale: 3806.5, g10Purchase: 3654,
  gold: { tolaSale: 296500, tolaPurchase: 284640, g10Sale: 254200, g10Purchase: 244035, carat: 24 },
  source: 'KAGOSIDA', via: 'kagosida.org.np',
};
const dom = new JSDOM(readFileSync('dist/home/index.html', 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://dppl.com.np/home',
  beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} }); } });
const { window } = dom;
window.scrollTo = () => {};
let fetches = 0;
window.fetch = () => { fetches++; return Promise.resolve({ ok: true, json: () => Promise.resolve(RATES) }); };
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
window.HTMLCanvasElement.prototype.getContext = () => ({
  setTransform(){}, clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, fill(){},
  createLinearGradient:()=>({addColorStop(){}}), createRadialGradient:()=>({addColorStop(){}}),
  drawImage(){}, save(){}, restore(){}, translate(){}, rotate(){}, stroke(){}, moveTo(){}, lineTo(){},
  measureText:()=>({width:10}), fillText(){}, closePath(){}, ellipse(){}, setLineDash(){}, arcTo(){} });
const errs = []; window.addEventListener('error', e => errs.push(e.message || String(e.error)));
window.eval(APP);
await new Promise(r => setTimeout(r, 900));

const d = window.document;
const goldPill = () => [...d.querySelectorAll('span')].find(e => /^Rs 2,96,500$/.test(e.textContent.trim()));
const node = goldPill();
console.log('gold pill before:', node?.textContent.trim());
console.log('entry animation on first paint:', !!d.querySelector('.rows-in'));

let ok = errs.length === 0 && !!node;
const c = (l, v) => { ok &&= v; console.log(`${v ? 'PASS ' : 'FAIL '} ${l}`); };

for (let i = 1; i <= 3; i++) {
  Object.defineProperty(d, 'visibilityState', { value: 'hidden', configurable: true });
  d.dispatchEvent(new window.Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 60));
  Object.defineProperty(d, 'visibilityState', { value: 'visible', configurable: true });
  d.dispatchEvent(new window.Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 250));
  const after = goldPill();
  c(`return ${i}: price stayed on screen`, !!after);
  c(`return ${i}: same DOM node reused (no remount)`, after === node);
}
c('entry animation never re-applied', d.querySelectorAll('.rows-in').length <= 1);
console.log(`fetches: ${fetches}`);
console.log('errors:', errs.length ? errs : 'none');
if (!ok) process.exit(1);
console.log('\nNO FLICKER ON TAB RETURN');
