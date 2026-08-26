import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';
import { Ticker, useDesk, useReveal } from '../lib/ui.jsx';
import { ARTICLES } from '../content/articles.js';

const WA = (msg) => `https://wa.me/9779805617932?text=${encodeURIComponent(msg)}`;
const MAPS_URL = 'https://maps.app.goo.gl/vi1fuUN78UcsuRTA7';

// what a buyer actually compares when choosing a format
const SPECS = {
  '100 g Silver Bar': { w: '100 g', t: '8.57', use: 'First holding' },
  '500 g Silver Bar': { w: '500 g', t: '42.87', use: 'Steady accumulation' },
  '1 kg Silver Bar': { w: '1,000 g', t: '85.74', use: 'Lowest premium / g' },
  'Silver Grains': { w: 'By weight', t: '—', use: 'Jewellers & industry' },
};

const scrollToSection = (e, href) => {
  const id = href.replace('#', '').replace('/', '');
  const el = document.getElementById(id);
  if (!el) return;
  if (e) e.preventDefault();
  try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  catch { scrollTo(0, el.offsetTop || 0); }
  history.replaceState(null, '', '/' + id);
};

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const WaIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7-3.9-3.4-4-3.6-.9-1.2-.9-2.3.6-1.6.8-1.8.4-.3.6-.3h.4c.2 0 .4-.1.6.4l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7s.8 1.3 1.7 2.1c1.2 1 2.1 1.3 2.4 1.5s.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.2.5.2.6.4s0 .9-.4 1.5z"/></svg>
);
const PRODUCTS = [
  { name: '100 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 100 gram fine silver bar 999', label: 'ENQUIRE · 100 G', msg: 'Hello DPPL, I would like to enquire about a 100g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The classic first holding — pocket-scale weight with the full DPPL diamond stamp. Ideal for gifting, savings, and starting a position.' },
  { name: '500 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 500 gram fine silver bar 999', label: 'ENQUIRE · 500 G', msg: 'Hello DPPL, I would like to enquire about a 500g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The investor\u2019s workhorse — meaningful weight at a tighter premium per gram, without the handling bulk of a kilo.' },
  { name: '1 kg Silver Bar', img: '/images/bar.webp', alt: 'DPPL 1 kilogram fine silver bar 999', label: 'ENQUIRE · 1 KG', msg: 'Hello DPPL, I would like to enquire about a 1kg Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The lowest premium per gram in the house. Preferred by serious investors and businesses accumulating in size.' },
  { name: 'Silver Grains', img: '/images/grains.webp', alt: 'DPPL silver grains 999 fine silver, 1 kg pack', label: 'ENQUIRE · GRAINS', msg: 'Hello DPPL, I would like to enquire about Silver Grains (999 fine). Please share today\u2019s price.', desc: 'Loose fine-silver grain for jewellers, manufacturers, and ritual use — sold to the exact gram you need, no more.' },
];
const FAQS = [
  {
    q: 'Where can I buy the best silver in Kathmandu?',
    a: 'DPPL trades from the 5th floor of Sasa Complex on New Road, Kathmandu \u2014 the street that has been Nepal\u2019s precious-metal market for generations. We deal only in 999 fine silver: bars of 100 g, 500 g and 1 kg, and loose silver grain sold by weight. Every piece is weighed on calibrated scales in front of you and leaves with a full invoice, and we buy back documented metal at the purchase rate published here.',
  },
  {
    q: 'What is today\u2019s silver price in Nepal?',
    a: 'The current silver rate for Kathmandu \u2014 both the sale price and the purchase price, per tola and per 10 grams \u2014 is published at the top of this page and updated each morning from the official Kathmandu bullion market reference. One tola is 11.6638 grams. Rates are confirmed at the counter at the time of your transaction.',
  },
  {
    q: 'Is DPPL a silver importer or a retail dealer?',
    a: 'Both sides of the trade run through the counter. DPPL supplies investment-grade 999 fine silver bars and industrial silver grain to households, jewellers and businesses in Kathmandu, in quantities from 100 grams upward. For larger or repeat commercial orders, call the counter on 01-5915052 to discuss supply and pricing.',
  },
  {
    q: 'What does 999 fine silver mean?',
    a: '999 fine means the metal is 99.9% pure silver \u2014 the standard for investment bullion, and higher than sterling silver, which is 92.5%. Every DPPL bar is stamped with its fineness, its weight, and the DPPL diamond mark, so its purity can be verified by anyone at any time.',
  },
  {
    q: 'How much do making charges add to a silver bar?',
    a: 'The published rate is the price of the metal by weight. Bars also carry a making charge covering refining, casting, stamping and packaging, which is added at the counter and itemised separately on your invoice. Making charges are lower per gram on larger bars, which is why a 1 kg bar costs less per gram than ten 100 g bars.',
  },
  {
    q: 'Does DPPL buy silver back?',
    a: 'Yes. We buy back bullion we have sold at the purchase rate published on this site on the day of the buy-back. Bring the metal and the original invoice; the bar is weighed and checked against the paperwork, and payment is made at the counter. Documentation is what keeps a bar liquid, so keep your invoices safe.',
  },
  {
    q: 'What are your opening hours and where exactly are you?',
    a: 'DPPL is open Sunday to Friday, 10:30 to 18:00 NPT, closed Saturdays and public holidays. The counter is on the 5th floor of Sasa Complex, New Road, Kathmandu 44600. Call 01-5915052, or message +977 980-561-7932 on WhatsApp before visiting for large orders.',
  },
];
const SOCIALS = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/dppl2080',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" /></svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/dppl2080',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /></svg>
    ),
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@dppl2080',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3v13.2a2.7 2.7 0 1 1-2.2-2.7v-3a5.7 5.7 0 1 0 5.2 5.7V9.3a7 7 0 0 0 4 1.3V7.5a4 4 0 0 1-4-4z" /></svg>
    ),
  },
];

const NAV = [
  ['home', 'Rates', 'scroll'],
  ['products', 'Silver', 'scroll'],
  ['articles', 'Journal', 'page'],
  ['about', 'Desk', 'scroll'],
  ['contact', 'Visit', 'scroll'],
];

/* ── Command palette ──────────────────────────────────────────
   Everything on the site reachable from the keyboard. ⌘K / Ctrl-K. */
function Palette({ open, setOpen }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => [
    ...NAV.map(([id, label, kind]) => ({
      label, hint: kind === 'page' ? '/articles' : `/${id}`, group: 'Go to',
      run: () => (kind === 'page' ? (location.href = '/articles') : scrollToSection(null, id)),
    })),
    ...ARTICLES.map((a) => ({ label: a.title, hint: a.category, group: 'Journal', run: () => (location.href = `/articles/${a.slug}`) })),
    { label: 'Call the counter', hint: '01-5915052', group: 'Contact', run: () => (location.href = 'tel:+97715915052') },
    { label: 'WhatsApp us', hint: '+977 980-561-7932', group: 'Contact', run: () => window.open(WA('Hello DPPL, I would like to enquire about silver.'), '_blank') },
    { label: 'Open in Google Maps', hint: 'Sasa Complex, New Road', group: 'Contact', run: () => window.open(MAPS_URL, '_blank') },
  ], []);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? items.filter((it) => (it.label + it.hint).toLowerCase().includes(s)) : items).slice(0, 8);
  }, [q, items]);

  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [setOpen]);

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  if (!open) return null;

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((n) => (n + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((n) => (n - 1 + hits.length) % hits.length); }
    if (e.key === 'Enter' && hits[i]) { e.preventDefault(); setOpen(false); hits[i].run(); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4 bg-base/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="panel-surface faceplate w-full max-w-lg overflow-hidden shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <span className="font-mono text-signal text-sm">›</span>
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} onKeyDown={onKey}
            placeholder="Search rates, silver, journal…" aria-label="Search the site"
            className="flex-1 bg-transparent outline-none text-text placeholder:text-mute text-sm font-mono" />
          <kbd className="kbd">esc</kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto py-1.5">
          {hits.length === 0 && <li className="px-4 py-6 text-center mono-label">No matches</li>}
          {hits.map((it, n) => (
            <li key={it.label}>
              <button onMouseEnter={() => setI(n)} onClick={() => { setOpen(false); it.run(); }}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${n === i ? 'bg-signal/10' : ''}`}>
                <span className={`w-1 h-1 rotate-45 ${n === i ? 'bg-signal' : 'bg-line'}`} />
                <span className="flex-1 text-sm text-text truncate">{it.label}</span>
                <span className="mono-label truncate max-w-[42%]">{it.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-line mono-label">
          <span><kbd className="kbd">↑↓</kbd> move</span><span><kbd className="kbd">⏎</kbd> open</span>
        </div>
      </div>
    </div>
  );
}

function Nav({ onPalette }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const bar = useRef(null);
  const lastY = useRef(0);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const onScroll = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      if (openRef.current) setOpen(false);
      if (y > lastY.current + 6 && y > 120) setHidden(true);
      else if (y < lastY.current - 4 || y < 120) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', esc);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('keydown', esc); };
  }, []);

  return (
    <nav className={`sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-line transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-px bg-signal shadow-[0_0_8px_#4DA3FF]" aria-hidden="true" />
      <div className="mx-auto max-w-[1360px] px-4 sm:px-7 flex items-center justify-between gap-6 py-3">
        <a href="/home" onClick={(e) => { setOpen(false); scrollToSection(e, 'home'); }} className="flex items-center gap-3">
          <img src="/images/logo.webp" alt="" width="36" height="36" className="w-9 h-9 rounded-md" />
          <span className="leading-none">
            <span className="block font-display font-bold text-text text-[1.05rem] tracking-[0.04em]">DPPL</span>
            <span className="block mono-label mt-1 text-[0.56rem]">Bullion desk · New Road</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-7">
          {NAV.map(([href, label, kind]) => (
            <li key={href}>
              <a href={`/${href}`} onClick={kind === 'page' ? undefined : (e) => scrollToSection(e, href)}
                 className="font-mono text-[0.72rem] tracking-[0.1em] text-mute hover:text-text transition-colors">
                {label}
              </a>
            </li>
          ))}
          <li>
            <button onClick={onPalette} className="flex items-center gap-2 border border-line rounded-md px-2.5 py-1.5 text-mute hover:border-signal hover:text-signal transition-colors" aria-label="Open command palette">
              <span className="font-mono text-[0.68rem]">Search</span><kbd className="kbd">⌘K</kbd>
            </button>
          </li>
          <li><a href={WA('Hello DPPL, I would like to enquire about silver.')} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-2">Enquire</a></li>
        </ul>

        <button className="md:hidden border border-line rounded-md p-2.5 text-text" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open
            ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        </button>
      </div>

      <div className={`md:hidden absolute top-full left-0 right-0 z-50 origin-top transition-all duration-300 ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
        <ul className="bg-panel border-b border-line shadow-[0_24px_48px_-16px_rgba(0,0,0,0.85)]">
          {NAV.map(([href, label, kind]) => (
            <li key={href} className="border-t border-line first:border-0">
              <a href={`/${href}`} onClick={kind === 'page' ? () => setOpen(false) : (e) => { setOpen(false); scrollToSection(e, href); }}
                 className="flex items-center justify-between px-6 py-4 font-mono text-[0.8rem] tracking-[0.08em] text-text">
                {label}<span className="text-signal" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* the desk status bar — always-on, like the bottom of an editor */
function StatusBar() {
  const desk = useDesk();
  return (
    <div className="hidden lg:flex fixed bottom-0 inset-x-0 z-30 items-center justify-between gap-6 px-5 py-1.5 bg-panel/95 backdrop-blur border-t border-line font-mono text-[0.62rem] tracking-[0.08em] text-mute">
      <span className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${desk.open ? 'bg-buy' : 'bg-mute'}`} />
        {desk.open ? 'Counter open' : 'Counter closed'} · Sun–Fri 10:30–18:00
      </span>
      <span className="flex items-center gap-5">
        <span>Kathmandu <span className="text-text tnum">{desk.time}</span></span>
        <span className="text-line">|</span>
        <span>999 fine silver · weighed at the counter</span>
        <span className="text-line">|</span>
        <span>Press <kbd className="kbd">⌘K</kbd></span>
      </span>
    </div>
  );
}

function Head({ id, label, title, lede }) {
  return (
    <div data-rv>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="hallmark" aria-hidden="true" />
        <span className="mono-label text-signal">{id}</span>
        <span className="mono-label">{label}</span>
        <span className="flex-1 h-px bg-line" aria-hidden="true" />
      </div>
      <h2 className="mt-7 font-display font-semibold text-text leading-[1.08] text-[clamp(1.5rem,5.4vw,3rem)] max-w-3xl">{title}</h2>
      {lede && <p className="mt-4 max-w-xl text-body/85">{lede}</p>}
    </div>
  );
}

const AD_SLOT = '';
function AdSlot() {
  useEffect(() => { if (AD_SLOT) { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} } }, []);
  if (!AD_SLOT) return null;
  return <div className="mt-12 min-h-[90px] flex items-center justify-center">
    <ins className="adsbygoogle block w-full" data-ad-client="ca-pub-6267575917692101" data-ad-slot={AD_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
  </div>;
}

export default function Site() {
  useReveal();
  const [pal, setPal] = useState(false);
  const openPal = useCallback(() => setPal(true), []);
  const wrap = 'mx-auto w-full max-w-[1360px] px-4 sm:px-7';

  return (
    <main className="relative z-10">
      <a href="/home" onClick={(e) => scrollToSection(e, 'home')} className="skip-link">Skip to content</a>
      <Nav onPalette={openPal} />
      <Ticker />
      <Palette open={pal} setOpen={setPal} />
      <StatusBar />

      {/* ── RATES ───────────────────────────────────────────── */}
      <section id="home" className={`${wrap} pt-8 sm:pt-16 pb-12 sm:pb-16 relative`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 stag">
            <p className="mono-label">Kathmandu · New Road · Est. 2080 B.S.</p>
            <h1 className="mt-6 font-display font-bold leading-[1.04] text-[clamp(1.9rem,7.4vw,4.2rem)] text-text">
              The silver rate,<br /><span className="chrome">live from the counter.</span>
            </h1>
            <p className="mt-6 max-w-lg text-body/85">
              Today's sale and purchase price, published before you walk in. 999 fine bars and loose
              grain, weighed on calibrated scales in front of you, invoiced to the gram, and bought
              back at the rate on this page.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <a href="/products" onClick={(e) => scrollToSection(e, 'products')} className="btn-primary flex-1 sm:flex-none">Browse silver</a>
              <a href={WA('Hello DPPL, I would like to enquire about today\u2019s rate.')} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1 sm:flex-none"><WaIcon /> WhatsApp</a>
              <button onClick={openPal} className="btn-ghost hidden sm:inline-flex">Search <kbd className="kbd ml-1">⌘K</kbd></button>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2" data-rv>
            <PriceCard />
            <p className="mt-3 mono-label leading-relaxed">
              Rate confirmed at the counter · Bars carry making charges above metal weight
            </p>
          </div>
        </div>
      </section>

      {/* ── SILVER ──────────────────────────────────────────── */}
      <section id="products" className={`${wrap} py-12 sm:py-20`}>
        <Head id="01" label="Inventory" title={<>Four formats, one purity.</>}
              lede="Every piece is 999 fine and stamped with the DPPL diamond. Prices follow the day's rate by weight; making charges are added on top and itemised on your invoice." />
        <div className="mt-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRODUCTS.map((p, i) => {
            const s = SPECS[p.name];
            return (
              <article key={p.label} data-rv data-rv-d={String(i % 4)}
                       className="panel-surface faceplate group flex flex-col overflow-hidden transition-all duration-300 hover:border-signal/50 hover:-translate-y-1">
                <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-raised/50">
                  <span className="mono-label">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mono-label text-signal">999</span>
                </div>
                <div className="px-5 pt-6 flex justify-center">
                  <img src={p.img} alt={p.alt} loading="lazy" width="700" height="933"
                       className="h-40 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.06]" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display font-semibold text-text text-[1.05rem]">{p.name}</h3>
                  <p className="mt-2.5 text-[0.9rem] text-body/80 leading-relaxed flex-1">{p.desc}</p>
                  <dl className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-y-2 font-mono text-[0.64rem] min-w-0">
                    <dt className="text-mute">Weight</dt><dd className="text-text text-right tnum">{s.w}</dd>
                    <dt className="text-mute">Tolas</dt><dd className="text-text text-right tnum">{s.t}</dd>
                    <dt className="text-mute">Suits</dt><dd className="text-text text-right">{s.use}</dd>
                  </dl>
                  <a href={WA(p.msg)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-4 w-full group-hover:border-signal group-hover:text-signal">Enquire →</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── JOURNAL ─────────────────────────────────────────── */}
      <section id="articles" className={`${wrap} py-12 sm:py-20`}>
        <Head id="02" label="Journal" title={<>Know the metal before you buy it.</>} />
        <ul className="mt-10 border-t border-line">
          {ARTICLES.slice(0, 4).map((a, i) => (
            <li key={a.slug} data-rv data-rv-d={String(i % 3)} className="border-b border-line">
              <a href={`/articles/${a.slug}`} className="group grid md:grid-cols-12 gap-3 md:gap-6 py-6 items-baseline">
                <span className="md:col-span-2 mono-label text-signal">{a.category}</span>
                <h3 className="md:col-span-7 font-display font-medium text-text text-[1.05rem] group-hover:text-signal transition-colors">{a.title}</h3>
                <span className="md:col-span-2 mono-label">{a.minutes} min</span>
                <span className="md:col-span-1 md:text-right text-signal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="/articles" className="btn-ghost mt-8">All {ARTICLES.length} articles</a>
        <AdSlot />
      </section>

      {/* ── DESK ────────────────────────────────────────────── */}
      <section id="about" className={`${wrap} py-12 sm:py-20`}>
        <Head id="03" label="The desk" title={<>A counter, not a storefront.</>} />
        <div className="mt-10 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5 text-body/85" data-rv>
            <p>
              DPPL was established in 2080 B.S. on the conviction that buying silver in Nepal should be
              as transparent as buying rice. We deal in one thing: fine silver, 999 purity — bars of
              100 g, 500 g and 1 kg, and loose grain for jewellers and manufacturers.
            </p>
            <p>
              Every bar carries the DPPL diamond stamp, is weighed on calibrated scales in front of the
              customer, and leaves with a full invoice. Every bar we sold, we also buy back — at the
              purchase rate published on this page, the same day. That is the whole business: honest
              metal, honest weight, honest paper.
            </p>
          </div>
          <dl className="lg:col-span-5 grid grid-cols-2 gap-3" data-rv data-rv-d="1">
            {[['999', 'Fineness'], ['2080', 'Established B.S.'], ['11.6638', 'Grams per tola'], ['100%', 'Invoiced sales']].map(([v, l]) => (
              <div key={l} className="panel-surface faceplate p-5">
                <dt className="font-mono tnum text-text text-[clamp(1.15rem,3vw,1.6rem)]">{v}</dt>
                <dd className="mono-label mt-2">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── QUESTIONS ───────────────────────────────────────── */}
      <section id="faq" className={`${wrap} py-12 sm:py-20`}>
        <Head id="04" label="Questions" title={<>Buying silver in Kathmandu.</>} />
        <div className="mt-10 border-t border-line">
          {FAQS.map((f, i) => (
            <details key={f.q} data-rv data-rv-d={String(i % 3)} className="group border-b border-line py-5">
              <summary className="flex items-start gap-4 cursor-pointer list-none">
                <span className="mono-label mt-1 w-7 shrink-0 text-signal">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="flex-1 font-display font-medium text-text text-[1rem] leading-snug group-hover:text-signal transition-colors">{f.q}</h3>
                <span className="text-signal text-lg leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3.5 pl-11 pr-6 text-[0.95rem] text-body/80 leading-relaxed max-w-3xl">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── VISIT ───────────────────────────────────────────── */}
      <section id="contact" className={`${wrap} py-12 sm:py-20`}>
        <Head id="05" label="Visit" title={<>Fifth floor, Sasa Complex.</>} />
        <div className="mt-10 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5" data-rv>
            <div className="panel-surface faceplate p-4 sm:p-6">
              <address className="not-italic text-[1.02rem] leading-relaxed text-text">
                DPPL<br />5th Floor, Sasa Complex<br />New Road, Kathmandu 44600<br />Nepal
              </address>
              <dl className="mt-6 border-t border-line">
                {[
                  ['Hours', <>Sun – Fri · 10:30–18:00 NPT<br /><span className="text-mute">Closed Saturdays &amp; public holidays</span></>],
                  ['Counter', <a href="tel:+97715915052" className="tnum hover:text-signal transition-colors">01-5915052</a>],
                  ['Mobile', <a href="tel:+9779805617932" className="tnum hover:text-signal transition-colors">+977 980-561-7932</a>],
                  ['Email', <a href="mailto:dppl2080@gmail.com" className="break-all hover:text-signal transition-colors">dppl2080@gmail.com</a>],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[4.2rem_1fr] sm:grid-cols-[5rem_1fr] gap-3 border-b border-line py-3 min-w-0">
                    <dt className="mono-label pt-1">{k}</dt>
                    <dd className="text-[0.95rem] text-text">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <a href="tel:+97715915052" className="btn-primary"><PhoneIcon /> Call</a>
                <a href={WA('Hello DPPL, I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WhatsApp</a>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">Maps ↗</a>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 panel-surface overflow-hidden min-h-[380px] relative" data-rv data-rv-d="1">
            <KathmanduMap className="absolute inset-0 w-full h-full" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-line mt-8 lg:mb-8">
        <div className={`${wrap} py-12 grid md:grid-cols-12 gap-8`}>
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo.webp" alt="" width="36" height="36" className="w-9 h-9 rounded-md" />
              <span className="font-display font-bold text-text text-[1.05rem] tracking-[0.04em]">DPPL</span>
            </div>
            <p className="mt-4 text-[0.9rem] text-mute leading-relaxed">
              Silver bullion, weighed and invoiced at the counter.<br />New Road, Kathmandu · Est. 2080 B.S.
            </p>
            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                   className="w-9 h-9 border border-line rounded-md flex items-center justify-center text-mute hover:text-signal hover:border-signal transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <nav className="md:col-span-2">
            <p className="mono-label">Sections</p>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              {NAV.map(([href, label, kind]) => (
                <li key={href}><a href={`/${href}`} onClick={kind === 'page' ? undefined : (e) => scrollToSection(e, href)} className="text-body/85 hover:text-signal transition-colors">{label}</a></li>
              ))}
            </ul>
          </nav>
          <nav className="md:col-span-3">
            <p className="mono-label">Journal</p>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              {ARTICLES.slice(0, 4).map((a) => (
                <li key={a.slug}><a href={`/articles/${a.slug}`} className="text-body/85 hover:text-signal transition-colors">{a.title}</a></li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-3">
            <p className="mono-label">Counter</p>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              <li><a href="tel:+97715915052" className="text-body/85 hover:text-signal transition-colors tnum">01-5915052</a></li>
              <li><a href="tel:+9779805617932" className="text-body/85 hover:text-signal transition-colors tnum">+977 980-561-7932</a></li>
              <li><a href="mailto:dppl2080@gmail.com" className="text-body/85 hover:text-signal transition-colors">dppl2080@gmail.com</a></li>
              <li><a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-body/85 hover:text-signal transition-colors">Sasa Complex, New Road ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className={`${wrap} py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mono-label`}>
            <p>© 2026 DPPL · All rights reserved</p>
            <p className="flex gap-5">
              <a href="/privacy" className="hover:text-text transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-text transition-colors">Terms</a>
              <a href="/articles" className="hover:text-text transition-colors">Journal</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
