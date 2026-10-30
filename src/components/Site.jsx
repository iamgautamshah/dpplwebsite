import { useEffect, useRef, useState } from 'react';
import { getSilver, useParallax, useReveal } from '../lib/ui.jsx';
import { ARTICLES } from '../content/articles.js';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';

export const WA = (msg) => `https://wa.me/9779805617932?text=${encodeURIComponent(msg)}`;
export const MAPS_URL = 'https://maps.app.goo.gl/5yAecqdMx1nu1hKc8';

export const PhoneIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

// exported so the FAQ structured data is built from exactly what the page shows
export const FAQS = [
  { q: 'Where can I buy gold and silver in Kathmandu?', a: 'Diamond Palace Pvt. Ltd. trades from the 5th floor of Sasa Complex on New Road, Kathmandu \u2014 the street that has been Nepal\u2019s precious-metal market for generations. We deal in 999 fine silver \u2014 bars of 100 g, 500 g and 1 kg, and loose grain sold by weight \u2014 and, since October 2026, in 24-carat gold. Every piece is weighed on calibrated scales in front of you and leaves with a full invoice, and we buy back documented metal at the purchase rate published here.' },
  { q: 'What is today\u2019s gold and silver price in Nepal?', a: 'The current gold and silver rates for Kathmandu \u2014 both the sale price and the purchase price, per tola and per 10 grams \u2014 is published on this page and updated each morning from the official Kathmandu bullion market reference. One tola is 11.6638 grams. Rates are confirmed at the counter at the time of your transaction.' },
  { q: 'Is Diamond Palace Pvt. Ltd. a precious-metal importer or a retail dealer?', a: 'Both sides of the trade run through the counter. Diamond Palace Pvt. Ltd. supplies investment-grade 999 fine silver bars and industrial silver grain to households, jewellers and businesses in Kathmandu, in quantities from 100 grams upward. For larger or repeat commercial orders, call the counter on 01-5915052 to discuss supply and pricing.' },
  { q: 'Do you sell gold as well as silver?', a: 'Yes. Diamond Palace Pvt. Ltd. opened its gold counter in October 2026, after three years dealing in silver. We quote 24-carat gold \u2014 the investment standard, 99.9% pure \u2014 per tola and per 10 grams, from the same Kathmandu market reference published on this page. Gold is weighed, invoiced and bought back on exactly the terms silver always has been.' },
  { q: 'What is the difference between 24-carat and 22-carat gold?', a: '24-carat gold is very nearly pure \u2014 999.9 fine \u2014 and is what bullion buyers hold, because its value is simply weight multiplied by the day\u2019s rate. 22-carat gold is 91.6% pure, alloyed for hardness so it can be worn as jewellery; it costs less per gram and carries higher making charges. The rate published on this page is for 24-carat gold. Ask at the counter for jewellery-grade pricing.' },
  { q: 'What does 999 fine silver mean?', a: '999 fine means the metal is 99.9% pure silver \u2014 the standard for investment bullion, and higher than sterling silver, which is 92.5%. Every Diamond Palace Pvt. Ltd. bar is stamped with its fineness, its weight, and the DPPL diamond mark, so its purity can be verified by anyone at any time.' },
  { q: 'Is there a making charge on gold and silver bars?', a: 'Yes, on both, and it is always shown separately. Gold bars carry a fixed making charge per bar, added to the published 24-carat rate for the weight. Silver bars and silver coins carry a minimal making charge, a small percentage of the metal value that is lower on larger bars. Either way it covers casting, stamping and packaging, appears as its own line on your invoice and in every online quotation, and is added to any applicable tax.' },
  { q: 'Do you supply raw gold for businesses?', a: 'Yes. Alongside finished gold bars, Diamond Palace Pvt. Ltd. supplies raw gold for business use \u2014 for jewellers, goldsmiths and manufacturers who need metal to work. It is sold by weight against the day\u2019s published gold rate and invoiced in full. Quantities are arranged directly with the counter: call 01-5915052 or message us on WhatsApp.' },
  { q: 'Does Diamond Palace Pvt. Ltd. buy gold and silver back?', a: 'Yes, both metals. We buy back bullion we have sold at the purchase rate published on this site on the day of the buy-back. Bring the metal and the original invoice; the bar is weighed and checked against the paperwork, and payment is made at the counter. Documentation is what keeps a bar liquid, so keep your invoices safe.' },
  { q: 'What are your opening hours and where exactly are you?', a: 'Diamond Palace Pvt. Ltd. is open Sunday to Friday, 10:30 to 18:00 NPT, closed Saturdays and public holidays. The counter is on the 5th floor of Sasa Complex, New Road, Kathmandu 44600. Call 01-5915052, or message +977 9805617932 on WhatsApp before visiting for large orders.' },
];

export const SOCIALS = [
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

export const WaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7-3.9-3.4-4-3.6-.9-1.2-.9-2.3.6-1.6.8-1.8.4-.3.6-.3h.4c.2 0 .4-.1.6.4l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7s.8 1.3 1.7 2.1c1.2 1 2.1 1.3 2.4 1.5s.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.2.5.2.6.4s0 .9-.4 1.5z" /></svg>
);

// The display case in the hero, and the shelves below it. Weights listed are
// the ones the quotation form offers (public/quotation/data/products.json).
export const IMG = {
  gold: { src: '/images/bar-gold-9999-v2.webp', w: 530, h: 796 },
  silverBar: { src: '/images/bar-fine-999.webp', w: 423, h: 796 },
  coin: { src: '/images/coin-silver-lakshmi.webp', w: 502, h: 500 },
  grains: { src: '/images/grains.webp', w: 430, h: 573 },
};

const GOLD_WEIGHTS = ['5 gram', '10 gram', '1 tola'];

// Bars stand at heights that grow with their weight, so the shelf itself shows
// the difference between 100 g and a kilo.
const SILVER_SHELF = [
  { name: '100 gram silver bar', img: IMG.silverBar, h: '52%', alt: 'Diamond Palace Pvt. Ltd. 100 gram 999 fine silver bar',
    note: 'The usual first bar: easy to keep, easy to gift.',
    msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 100 gram Silver Bar (999). Please share today\u2019s price.' },
  { name: '500 gram silver bar', img: IMG.silverBar, h: '74%', alt: 'Diamond Palace Pvt. Ltd. 500 gram 999 fine silver bar',
    note: 'More metal for a smaller making charge per gram.',
    msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 500 gram Silver Bar (999). Please share today\u2019s price.' },
  { name: '1000 gram silver bar', img: IMG.silverBar, h: '96%', alt: 'Diamond Palace Pvt. Ltd. 1000 gram 999 fine silver bar',
    note: 'The lowest making charge per gram we offer.',
    msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 1000 gram Silver Bar (999). Please share today\u2019s price.' },
  { name: 'Silver coins', img: IMG.coin, h: '50%', alt: 'Diamond Palace Pvt. Ltd. Lakshmi silver coin, 999 fine silver',
    note: '5, 10, 20 and 50 gram, including the Lakshmi coin minted for Dhanteras.',
    msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about Silver Coins (999). Please share today\u2019s price and available weights.' },
  { name: 'Silver grains', img: IMG.grains, h: '66%', alt: 'Diamond Palace Pvt. Ltd. 999 fine silver grains',
    note: 'Loose fine silver sold to the gram, for jewellers and businesses.',
    msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about Silver Grains (999). Please share today\u2019s price.' },
];


// scroll to the section and put its own path in the address bar — /contact,
// /products and so on, each of which is also a real page if reloaded
const NAV_H = 74;   // sticky bar, so a heading is not hidden under it

const scrollToSection = (e, href) => {
  const id = href.replace('#', '').replace('/', '');
  const el = document.getElementById(id);
  if (!el) return;
  if (e) e.preventDefault();

  const go = () => {
    const y = el.getBoundingClientRect().top + scrollY - NAV_H;
    try { scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }
    catch { scrollTo(0, Math.max(0, y)); }
  };
  go();
  // anything still loading above the target shifts it, so measure again once
  // the first scroll has settled and correct if it moved
  setTimeout(() => {
    const off = el.getBoundingClientRect().top - NAV_H;
    if (Math.abs(off) > 8) go();
  }, 450);

  // a fragment, not a path: /#products is the same page to a search engine,
  // whereas /products was a second URL that redirected
  history.replaceState(null, '', id === 'home' ? '/' : '/#' + id);
};

const Ledger = ({ children, light = false }) => (
  <p className={`flex items-center gap-3.5 mb-4 text-[0.64rem] tracking-[0.42em] uppercase ${light ? 'text-[#8A8271]' : 'text-steel'}`}>
    <span className="hallmark" aria-hidden="true" />
    <span>{children}</span>
    <span className={`flex-1 h-px ${light ? 'bg-[#1C222E]/15' : 'bg-silver/15'}`} aria-hidden="true" />
  </p>
);

export function Nav({ current = null }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const bar = useRef(null);
  const lastY = useRef(0);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    // batched into one frame, and driven by transform so no layout is forced
    let ticking = false;
    const frame = () => {
      ticking = false;
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (openRef.current) setOpen(false);                    // scrolling dismisses the menu
      if (y > lastY.current + 6 && y > 90) setHidden(true);   // scrolling down → tuck away
      else if (y < lastY.current - 4 || y < 90) setHidden(false); // scrolling up → return
      lastY.current = y;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };
    frame();
    addEventListener('scroll', onScroll, { passive: true });
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('keydown', onKey); };
  }, []);

  // Every menu item opens its own page. HOME, clicked while already on the
  // home page, scrolls back to the top instead of reloading.
  const links = [
    { key: 'home', label: 'HOME', url: '/', scroll: true },
    { key: 'products', label: 'PRODUCTS', url: '/products' },
    { key: 'rates', label: 'TODAY\u2019S RATE', url: '/rates' },
    { key: 'articles', label: 'JOURNAL', url: '/articles' },
    { key: 'about', label: 'ABOUT US', url: '/about' },
    { key: 'contact', label: 'CONTACT', url: '/contact' },
    { key: 'quotation', label: 'QUOTATION', url: '/quotation' },
  ];
  const go = (e, l) => { setOpen(false); if (l.scroll && location.pathname === '/') scrollToSection(e, '#' + l.key); };

  return (
    <nav className={`sticky top-0 z-40 bg-[#0A0E16]/95 backdrop-blur-sm border-b border-silver/10 transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-[2px] w-full bg-gold origin-left will-change-transform" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />
      <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3">
        <a href="/" onClick={(e) => go(e, links[0])} className="flex items-center gap-3">
          <img src="/images/logo-gold.webp" alt="Diamond Palace Pvt. Ltd. — home" className="h-11 w-auto" width="420" height="279" />
        </a>
        <ul className="hidden lg:flex gap-7 items-center">
          {links.map((l) => (
            <li key={l.key}>
              <a
                href={l.url}
                onClick={(e) => go(e, l)}
                aria-current={current === l.key ? 'page' : undefined}
                className={`block py-1 text-[0.7rem] tracking-[0.2em] transition-colors duration-300 hover:text-gold ${current === l.key ? 'text-gold' : 'text-silver/90'}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="lg:hidden border border-silver/25 rounded-lg p-2.5 text-silver transition-colors hover:border-gold hover:text-gold"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </div>

            <div className={`lg:hidden absolute top-full left-0 right-0 z-50 origin-top transition-all duration-300 ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
        <ul className="bg-[#05080F] border-b border-gold/30 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] py-2">
          {links.map((l) => (
            <li key={l.key}>
              <a
                href={l.url}
                onClick={(e) => go(e, l)}
                aria-current={current === l.key ? 'page' : undefined}
                className={`block px-6 py-4 text-center text-[0.8rem] tracking-[0.24em] transition-colors hover:text-gold hover:bg-silver/[0.04] ${current === l.key ? 'text-gold' : 'text-silver'}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* ── the display case ────────────────────────────────────────────────────
   The bullion itself is the first thing on the page: a silver bar, a gold
   bar and a Lakshmi coin standing on a lit ledge, with their reflections.
   The one moment of motion is a light passing across the gold bar. It starts
   and ends invisible, so it cannot flash when React replaces the
   prerendered page. */
const Piece = ({ cls, img, glint = false, priority = false }) => (
  <div className={`piece ${cls}`}>
    <img src={img.src} alt="" width={img.w} height={img.h} decoding="async" {...(priority ? { fetchpriority: 'high' } : { loading: 'lazy' })} />
    {glint && <span className="glint" aria-hidden="true" style={{ WebkitMaskImage: `url(${img.src})`, maskImage: `url(${img.src})` }} />}
    <img src={img.src} alt="" aria-hidden="true" className="mirror" width={img.w} height={img.h} decoding="async" loading="lazy" />
  </div>
);

function Hero() {
  return (
    <section id="home" className="vault relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-6 sm:pt-12 lg:pt-14 pb-6 lg:pb-12 grid lg:grid-cols-[0.95fr_1.15fr] gap-2 lg:gap-10 items-center">
        <div className="order-2 lg:order-1 max-w-xl">
          <h1 className="engraved font-display text-silverhi leading-[1.08] text-[clamp(2rem,4.5vw,3.45rem)]">
            Fine gold and silver, sold by weight.
          </h1>
          <p className="mt-5 max-w-[34rem] text-[1.02rem] leading-relaxed text-silver/80">
            24-carat gold bars and 999 fine silver bars, coins and grains, from our counter on New Road, Kathmandu.
            Every piece is weighed in front of you and invoiced to the gram.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <a href="/#products" onClick={(e) => scrollToSection(e, '#products')} className="btn-gold">See the bullion</a>
            <a href="/quotation" className="btn-line">Request a quotation</a>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="display" role="img" aria-label="A 999 fine silver bar, a 24-carat gold bar and a Lakshmi silver coin from Diamond Palace Pvt. Ltd.">
            <Piece cls="piece-silver" img={IMG.silverBar} priority />
            <Piece cls="piece-gold" img={IMG.gold} glint priority />
            <Piece cls="piece-coin" img={IMG.coin} priority />
          </div>
        </div>
      </div>
    </section>
  );
}

/* Today's selling rate in one line, under the display — the full board is
   further down the page. */
function RateStrip() {
  const [p, setP] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    getSilver().then((d) => alive && setP(d)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const gold = p?.gold?.g10Sale;
  const silver = p?.g10Sale;
  return (
    <div className="border-y border-gold/20 bg-[#070B15]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-3 flex flex-wrap items-baseline gap-x-7 gap-y-1.5 text-[0.9rem]">
        <span className="text-silver/60">Today’s selling rate, per 10 grams</span>
        {failed ? (
          <span className="text-silver/80">is published each morning.</span>
        ) : (
          <>
            <span className="text-silver/85">Gold 24K <b className="tnum font-semibold text-gold">{gold ? rs(gold) : '…'}</b></span>
            <span className="text-silver/85">Silver 999 <b className="tnum font-semibold text-silverhi">{silver ? rs(silver) : '…'}</b></span>
          </>
        )}
        <a href="/#rates" onClick={(e) => scrollToSection(e, '#rates')} className="sm:ml-auto text-gold border-b border-gold/40 pb-0.5 transition-colors hover:text-gold-light">See the full rate board</a>
      </div>
    </div>
  );
}

export function GoldShowcase() {
  return (
    <div id="gold" className="grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-16 items-center">
      <div className="pedestal pedestal-gold">
        <img src={IMG.gold.src} alt="Diamond Palace Pvt. Ltd. 24-carat 999.9 fine gold bar" width={IMG.gold.w} height={IMG.gold.h} loading="lazy" decoding="async" />
      </div>
      <div>
        <h2 className="engraved font-display text-silverhi text-[clamp(1.9rem,4.4vw,3rem)]">24-carat gold bars</h2>
        <p className="mt-2 text-gold text-[1.02rem]">999.9 fine, stamped and sealed</p>
        <p className="prose-justify mt-5 max-w-xl text-[0.98rem] leading-relaxed text-silver/80">
          Our gold counter opened in October 2026. Bars are sold by weight at the day’s published gold rate, plus a fixed
          making charge per bar that is shown as its own line on your invoice and in every quotation. We buy back the
          gold we sell at the published purchase rate.
        </p>
        <div className="mt-6">
          <p className="text-sm text-silver/60">Bar weights at the counter</p>
          <ul className="mt-2.5 flex flex-wrap gap-2.5">
            {GOLD_WEIGHTS.map((w) => (
              <li key={w} className="weight-chip">{w}</li>
            ))}
          </ul>
        </div>
        <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-silver/75">
          <b className="font-medium text-silverhi">Raw gold for business.</b> Jewellers, goldsmiths and manufacturers can buy raw
          gold by weight at the day’s rate. Quantities are arranged with the counter.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/quotation" className="btn-gold">Get a gold quotation</a>
          <a href={WA('Hello Diamond Palace Pvt. Ltd., I would like to enquire about 24-carat gold bars.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> Ask on WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

export function SilverShelf() {
  return (
    <div id="silver" className="mt-20 lg:mt-28">
      <div className="max-w-2xl">
        <h2 className="engraved font-display text-silverhi text-[clamp(1.9rem,4.4vw,3rem)]">999 fine silver</h2>
        <p className="prose-justify mt-4 text-[0.98rem] leading-relaxed text-silver/80">
          Bars from 100 grams to a kilo, coins and loose grains, all 99.9% pure. Silver is sold by weight at the day’s rate
          with a minimal making charge, smaller per gram on larger bars.
        </p>
      </div>
      <ul className="shelf mt-10">
        {SILVER_SHELF.map((it) => (
          <li key={it.name} className="shelf-item">
            <div className="shelf-stage">
              <img src={it.img.src} alt={it.alt} width={it.img.w} height={it.img.h} loading="lazy" decoding="async" style={{ height: it.h }} />
            </div>
            <h3 className="mt-4 font-display text-silverhi text-[1.05rem] leading-snug">{it.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-silver/65">{it.note}</p>
            <a href={WA(it.msg)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-gold border-b border-gold/40 pb-0.5 transition-colors hover:text-gold-light">Enquire on WhatsApp</a>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-silver/55">
        Pictures show the style of each piece; the stamping, finish and packaging of what is at the counter can differ.
        Weight and fineness are exactly as stated and are checked on the scale in front of you before you pay.
      </p>
    </div>
  );
}

// The full rate board mounts when it scrolls into view, so its set-down
// animation plays where the visitor can see it rather than off-screen.
function WhenVisible({ children, minHeight }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={on ? undefined : { minHeight }}>{on && children}</div>;
}

function RatesSection() {
  return (
    <section id="rates" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
      <div className="frame grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-14 items-center max-w-6xl mx-auto p-5 sm:p-8 md:p-10">
        <div>
          <h2 className="engraved font-display text-silverhi text-[clamp(1.6rem,3.4vw,2.3rem)]">Today’s gold and silver rate</h2>
          <p className="prose-justify mt-4 max-w-lg text-[0.98rem] leading-relaxed text-silver/80">
            The day’s sale and purchase rates per tola and per 10 grams, published each morning from the Kathmandu bullion
            market. The rate is for the metal by weight; making charges are added per bar or coin.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/quotation" className="btn-gold">Request a quotation</a>
            <a href={WA('Hello Diamond Palace Pvt. Ltd., I would like to know today’s gold and silver price.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> Ask on WhatsApp</a>
          </div>
          <p className="mt-6 text-sm text-silver/70">
            Past days’ rates are on the <a href="/rates#history" className="text-gold border-b border-gold/40 hover:border-gold">rate page</a>.
          </p>
        </div>
        <div className="relative w-full max-w-[420px] mx-auto lg:mx-0 lg:w-[420px]">
          <WhenVisible minHeight={340}><PriceCard /></WhenVisible>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-silver/10 px-4 sm:px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <img src="/images/logo-gold.webp" alt="Diamond Palace Pvt. Ltd." className="h-9 w-auto" width="420" height="279" />
          <p className="text-xs text-steel leading-relaxed tracking-wide">
            <span className="font-display text-silver tracking-[0.14em] text-sm">Diamond Palace Pvt. Ltd.</span><br />Est. 2080 B.S.
          </p>
        </div>
          <div className="text-xs text-steel leading-relaxed tracking-wide sm:text-right">
            <p>5th Floor, Sasa Complex, New Road, Kathmandu<br />© 2026 Diamond Palace Pvt. Ltd. All rights reserved.</p>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              <a href="/about" className="transition-colors hover:text-gold">About us</a>
              <a href="/contact" className="transition-colors hover:text-gold">Contact</a>
              <a href="/products" className="transition-colors hover:text-gold">Products</a>
              <a href="/rates" className="transition-colors hover:text-gold">Today’s rate</a>
              <a href="/quotation" className="transition-colors hover:text-gold">Quotation</a>
              <a href="/articles" className="transition-colors hover:text-gold">Journal</a>
              <a href="/privacy" className="transition-colors hover:text-gold">Privacy Policy</a>
              <a href="/terms" className="transition-colors hover:text-gold">Terms of Use</a>
              <a href="mailto:dppl2080@gmail.com" className="transition-colors hover:text-gold">dppl2080@gmail.com</a>
            </p>
            <p className="mt-4 flex gap-3 sm:justify-end">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                   className="w-9 h-9 rounded-full border border-silver/20 flex items-center justify-center text-silver/70 transition-all hover:border-gold hover:text-gold hover:-translate-y-0.5">
                  {s.icon}
                </a>
              ))}
            </p>
          </div>
        </div>
      </footer>
  );
}

const AD_SLOT = '';
function AdSlot() {
  useEffect(() => {
    if (!AD_SLOT) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  if (!AD_SLOT) return null;
  return (
    <div className="mt-10 min-h-[90px] flex items-center justify-center">
      <ins className="adsbygoogle block w-full" data-ad-client="ca-pub-6267575917692101" data-ad-slot={AD_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

export default function Site() {
  useReveal();
  useParallax();
  return (
    <main className="relative z-10 bg-[#0B0F16]">
      <a href="/" onClick={(e) => scrollToSection(e, '#home')} className="skip-link">Skip to content</a>
      <Nav current="home" />
      <Hero />
      <RateStrip />

      <section id="products" className="px-5 sm:px-8 md:px-12 pt-16 sm:pt-24 pb-10 sm:pb-16">
        <div className="max-w-7xl mx-auto">
          <GoldShowcase />
          <SilverShelf />
        </div>
      </section>

      <RatesSection />

            <section id="articles" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>The DPPL Journal</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Understand the metal before you buy it.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {ARTICLES.slice(0, 4).map((a, i) => (
              <article key={a.slug} data-rv data-rv-d={String(i % 2)} className="flex flex-col rounded-2xl border border-silver/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold/35 hover:bg-white/[0.04]">
                <p className="text-[0.6rem] tracking-[0.34em] uppercase text-gold mb-3">{a.category}</p>
                <h3 className="font-display text-silverhi text-xl leading-snug">
                  <a href={`/articles/${a.slug}`} className="transition-colors hover:text-gold">{a.title}</a>
                </h3>
                <p className="mt-3 text-sm text-silver/70 leading-relaxed flex-1">{a.teaser}</p>
                <a href={`/articles/${a.slug}`} className="mt-4 self-start text-[0.72rem] tracking-[0.22em] uppercase text-gold border-b border-gold/40 pb-1">Read the article →</a>
              </article>
            ))}
          </div>
          <a href="/articles" className="btn-line inline-block mt-8">READ ALL {ARTICLES.length} ARTICLES →</a>

          <AdSlot />
        </div>
      </section>

            <section id="about" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-start p-5 sm:p-8 md:p-12">
          <img data-rv src="/images/logo-gold-square.webp" alt="Diamond Palace Pvt. Ltd. official seal — est. 2080 B.S., Kathmandu" loading="lazy" decoding="async" width="512" height="512" data-parallax="0.08" className="parallax w-52 md:w-64 rounded-3xl mx-auto transition-transform duration-500 hover:rotate-3" />
          <div data-rv>
            <Ledger>Provenance</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(1.5rem,3.6vw,2.4rem)]">Diamond Palace Pvt. Ltd.</h2>
            <p className="prose-justify mt-4 max-w-3xl text-silver/80 leading-loose text-[0.95rem]">
              Diamond Palace Pvt. Ltd. was established in 2080 B.S. with a simple conviction: that buying precious metal in Nepal should be as transparent as buying rice. From the 5th floor of Sasa Complex on New Road — the street where Kathmandu has traded for over a century — we deal in fine metal by weight: 999 silver in bars of 100 g, 500 g and 1 kg and in loose grains for jewellers and manufacturers, and, since October 2026, 24-carat gold.</p>
            <p className="prose-justify mt-4 max-w-3xl text-silver/80 leading-loose text-[0.95rem]">
              Every bar we sell carries the DPPL diamond stamp, is weighed on calibrated scales in front of the customer, and leaves the counter with a full VAT invoice. Every bar we sold, we also buy back — at the purchase rate published on this page, the same day. That is the whole business model: honest metal, honest weight, honest paper.
            </p>
            <div className="flex flex-wrap gap-10 mt-8">
              {[['999.9', 'Gold fineness'], ['999', 'Silver fineness'], ['2080', 'Established B.S.'], ['100%', 'Invoiced sales']].map(([v, l]) => (
                <div key={l}>
                  <b className="block font-display font-normal text-3xl text-gold">{v}</b>
                  <span className="text-[0.7rem] tracking-[0.26em] uppercase text-steel">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

            <section id="faq" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>Common questions</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Buying gold &amp; silver in Kathmandu</h2>
          </div>
          <div className="mt-8 divide-y divide-silver/10">
            {FAQS.map((f, i) => (
              <details key={f.q} data-rv data-rv-d={String(i % 3)} className="group py-5">
                <summary className="flex items-start gap-4 cursor-pointer list-none">
                  <span className="hallmark mt-2 shrink-0" aria-hidden="true" />
                  <h3 className="flex-1 font-body font-medium text-silverhi text-[1.02rem] leading-snug transition-colors group-hover:text-gold">{f.q}</h3>
                  <span className="mt-1 text-gold text-lg leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="prose-justify mt-3 pl-7 text-[0.95rem] leading-relaxed text-silver/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>The counter</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Visit the counter.</h2>
            <address className="mt-6 not-italic text-lg leading-relaxed text-silver/85">
              <b className="text-gold font-medium">Diamond Palace Pvt. Ltd.</b><br />5th Floor, Sasa Complex<br />New Road, Kathmandu 44600, Nepal
            </address>
            <ul className="mt-6 space-y-3.5 text-[0.95rem] text-silver/85">
              <li className="flex gap-4">
                <span className="w-[4.5rem] shrink-0 pt-1 font-mono text-[0.6rem] tracking-[0.24em] text-gold/80">HOURS</span>
                <span>Sun – Fri · 10:30 – 18:00 NPT<br /><span className="text-steel text-sm">Closed Saturdays and public holidays</span></span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] tracking-[0.24em] text-gold/80">COUNTER</span>
                <a href="tel:+97715915052" className="tnum transition-colors hover:text-gold">01-5915052</a>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] tracking-[0.24em] text-gold/80">MOBILE</span>
                <a href="tel:+9779805617932" className="tnum transition-colors hover:text-gold">+977 9805617932</a>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] tracking-[0.24em] text-gold/80">EMAIL</span>
                <a href="mailto:dppl2080@gmail.com" className="break-all transition-colors hover:text-gold">dppl2080@gmail.com</a>
              </li>
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a href="tel:+97715915052" className="btn-gold inline-flex items-center justify-center gap-2"><PhoneIcon /> CALL US</a>
              <a href={WA('Hello Diamond Palace Pvt. Ltd., I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP</a>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn-line inline-flex items-center justify-center">GOOGLE MAPS ↗</a>
            </div>
          </div>
          <div className="border border-gold/30 rounded-2xl overflow-hidden min-h-[340px] relative bg-[#0A0E15]">
            <KathmanduMap className="absolute inset-0 w-full h-full" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
