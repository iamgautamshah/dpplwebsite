import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
const APP = readFileSync('/tmp/app-iife.js', 'utf8');
const dom = new JSDOM(readFileSync('dist/home/index.html', 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://dppl.com.np/home',
  beforeParse(w) { w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} }); } });
const { window } = dom;
window.scrollTo = () => {};
window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({
  tolaSale: 4440, tolaPurchase: 4262, g10Sale: 3806.5, g10Purchase: 3654,
  gold: { tolaSale: 296500, tolaPurchase: 284640, g10Sale: 254200, g10Purchase: 244035, carat: 24 },
  source: 'KAGOSIDA', via: 'kagosida.org.np' }) });
window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
window.HTMLCanvasElement.prototype.getContext = () => ({
  setTransform(){}, clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, fill(){},
  createLinearGradient:()=>({addColorStop(){}}), createRadialGradient:()=>({addColorStop(){}}),
  drawImage(){}, save(){}, restore(){}, translate(){}, rotate(){}, stroke(){}, moveTo(){}, lineTo(){},
  measureText:()=>({width:10}), fillText(){}, closePath(){}, ellipse(){}, setLineDash(){}, arcTo(){} });
const errs = []; window.addEventListener('error', e => errs.push(e.message || String(e.error)));
window.eval(APP);
await new Promise(r => setTimeout(r, 800));
const t = window.document.getElementById('root').textContent.replace(/\s+/g, ' ');
const card = t.slice(t.indexOf('Gold'), t.indexOf('Gold') + 180);
console.log('card reads:', card.replace(/\s+/g, ' '));
let ok = errs.length === 0;
for (const [l, v] of [
  ['gold heading', /Gold 24K/.test(t)],
  ['gold tola sale 2,96,500', /2,96,500/.test(t)],
  ['gold tola buy 2,84,640', /2,84,640/.test(t)],
  ['gold 10g 2,54,200', /2,54,200/.test(t)],
  ['silver heading', /Silver 999/.test(t)],
  ['silver 4,440', t.includes('4,440')],
]) { ok &&= v; console.log(`${v ? 'PASS ' : 'FAIL '} ${l}`); }
console.log('errors:', errs.length ? errs : 'none');
if (!ok) process.exit(1);
