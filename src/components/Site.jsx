import { useEffect, useRef, useState } from 'react';
import { Ticker, useParallax, useReveal } from '../lib/ui.jsx';
import { ARTICLES } from '../content/articles.js';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';

const WA = (msg) => `https://wa.me/9779805617932?text=${encodeURIComponent(msg)}`;
const MAPS_URL = 'https://maps.app.goo.gl/5yAecqdMx1nu1hKc8';

const PhoneIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

// exported so the FAQ structured data is built from exactly what the page shows
export const FAQS = [
  { q: 'Where can I buy gold and silver in Kathmandu?', a: 'Diamond Palace Pvt. Ltd. trades from the 5th floor of Sasa Complex on New Road, Kathmandu \u2014 the street that has been Nepal\u2019s precious-metal market for generations. We deal in 999 fine silver \u2014 bars of 100 g, 500 g and 1 kg, and loose grain sold by weight \u2014 and, since October 2026, in 24-carat gold. Every piece is weighed on calibrated scales in front of you and leaves with a full invoice, and we buy back documented metal at the purchase rate published here.' },
  { q: 'What is today\u2019s gold and silver price in Nepal?', a: 'The current gold and silver rates for Kathmandu \u2014 both the sale price and the purchase price, per tola and per 10 grams \u2014 is published at the top of this page and updated each morning from the official Kathmandu bullion market reference. One tola is 11.6638 grams. Rates are confirmed at the counter at the time of your transaction.' },
  { q: 'Is Diamond Palace Pvt. Ltd. a precious-metal importer or a retail dealer?', a: 'Both sides of the trade run through the counter. Diamond Palace Pvt. Ltd. supplies investment-grade 999 fine silver bars and industrial silver grain to households, jewellers and businesses in Kathmandu, in quantities from 100 grams upward. For larger or repeat commercial orders, call the counter on 01-5915052 to discuss supply and pricing.' },
  { q: 'Do you sell gold as well as silver?', a: 'Yes. Diamond Palace Pvt. Ltd. opened its gold counter in October 2026, after three years dealing in silver. We quote 24-carat gold \u2014 the investment standard, 99.9% pure \u2014 per tola and per 10 grams, from the same Kathmandu market reference published at the top of this page. Gold is weighed, invoiced and bought back on exactly the terms silver always has been.' },
  { q: 'What is the difference between 24-carat and 22-carat gold?', a: '24-carat gold is very nearly pure \u2014 999.9 fine \u2014 and is what bullion buyers hold, because its value is simply weight multiplied by the day\u2019s rate. 22-carat gold is 91.6% pure, alloyed for hardness so it can be worn as jewellery; it costs less per gram and carries higher making charges. The rate published on this page is for 24-carat gold. Ask at the counter for jewellery-grade pricing.' },
  { q: 'What does 999 fine silver mean?', a: '999 fine means the metal is 99.9% pure silver \u2014 the standard for investment bullion, and higher than sterling silver, which is 92.5%. Every Diamond Palace Pvt. Ltd. bar is stamped with its fineness, its weight, and the DPPL diamond mark, so its purity can be verified by anyone at any time.' },
  { q: 'Is there a making charge on gold and silver bars?', a: 'Yes, on both, and it is always shown separately. Gold bars carry a fixed making charge per bar, added to the published 24-carat rate for the weight. Silver bars and silver coins carry a minimal making charge, a small percentage of the metal value that is lower on larger bars. Either way it covers casting, stamping and packaging, appears as its own line on your invoice and in every online quotation, and is added to any applicable tax.' },
  { q: 'Do you supply raw gold for businesses?', a: 'Yes. Alongside finished gold bars, Diamond Palace Pvt. Ltd. supplies raw gold for business use \u2014 for jewellers, goldsmiths and manufacturers who need metal to work. It is sold by weight against the day\u2019s published gold rate and invoiced in full. Quantities are arranged directly with the counter: call 01-5915052 or message us on WhatsApp.' },
  { q: 'Does Diamond Palace Pvt. Ltd. buy gold and silver back?', a: 'Yes, both metals. We buy back bullion we have sold at the purchase rate published on this site on the day of the buy-back. Bring the metal and the original invoice; the bar is weighed and checked against the paperwork, and payment is made at the counter. Documentation is what keeps a bar liquid, so keep your invoices safe.' },
  { q: 'What are your opening hours and where exactly are you?', a: 'Diamond Palace Pvt. Ltd. is open Sunday to Friday, 10:30 to 18:00 NPT, closed Saturdays and public holidays. The counter is on the 5th floor of Sasa Complex, New Road, Kathmandu 44600. Call 01-5915052, or message +977 9805617932 on WhatsApp before visiting for large orders.' },
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

const WaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7-3.9-3.4-4-3.6-.9-1.2-.9-2.3.6-1.6.8-1.8.4-.3.6-.3h.4c.2 0 .4-.1.6.4l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7s.8 1.3 1.7 2.1c1.2 1 2.1 1.3 2.4 1.5s.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.2.5.2.6.4s0 .9-.4 1.5z" /></svg>
);

const PRODUCTS = [
  { name: 'Fine Gold Bar', metal: 'gold', img: '/images/bar-gold-9999-v2.webp', w: 530, h: 796, alt: 'Diamond Palace Pvt. Ltd. fine gold bar, 999.9 24 carat', label: 'ENQUIRE', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a Fine Gold Bar (999.9). Please share today\u2019s price and available weights.', desc: 'Stamped 999.9 and sealed, in a range of weights held at the counter. Priced by weight at the day\u2019s published gold rate plus a fixed making charge per bar — weighed in front of you, invoiced to the gram, and bought back whenever you choose to sell.' },
  { name: 'Lakshmi Silver Coin', metal: 'silver', seasonal: true, img: '/images/coin-silver-lakshmi.webp', w: 502, h: 500, alt: 'Diamond Palace Pvt. Ltd. Lakshmi silver coin, 999 fine silver, Dhanteras edition', label: 'ENQUIRE \u00b7 COIN', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about the Lakshmi Silver Coin for Dhanteras.', desc: 'A 999 fine silver coin struck with Goddess Lakshmi on the lotus \u2014 minted for Dhanteras, the day Nepali households have bought silver for generations. Available for a limited period around Deepawali only.' },
  { name: '100 g Silver Bar', img: '/images/bar-fine-999.webp', w: 423, h: 796, alt: 'Diamond Palace Pvt. Ltd. 100 gram fine silver bar 999', label: 'ENQUIRE · 100 G', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 100g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The classic first holding — pocket-scale weight with the full DPPL diamond stamp. Ideal for gifting, savings, and starting a position.' },
  { name: '500 g Silver Bar', img: '/images/bar-fine-999.webp', w: 423, h: 796, alt: 'Diamond Palace Pvt. Ltd. 500 gram fine silver bar 999', label: 'ENQUIRE · 500 G', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 500g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The investor\u2019s workhorse — meaningful weight at a tighter premium per gram, without the handling bulk of a kilo.' },
  { name: '1 kg Silver Bar', img: '/images/bar-fine-999.webp', w: 423, h: 796, alt: 'Diamond Palace Pvt. Ltd. 1 kilogram fine silver bar 999', label: 'ENQUIRE · 1 KG', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about a 1kg Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The lowest premium per gram in the house. Preferred by serious investors and businesses accumulating in size.' },
  { name: 'Silver Grains', img: '/images/grains.webp', w: 430, h: 573, alt: 'Diamond Palace Pvt. Ltd. silver grains, 999 fine silver, 1 kg pack', label: 'ENQUIRE · GRAINS', msg: 'Hello Diamond Palace Pvt. Ltd., I would like to enquire about Silver Grains (999 fine). Please share today\u2019s price.', desc: 'Loose fine-silver grain for jewellers, manufacturers, and ritual use — sold to the exact gram you need, no more.' },
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

function Nav() {
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

  // 'page' navigates, 'scroll' jumps to a section of the home page
  const links = [
    ['home', 'HOME', 'scroll'],
    ['products', 'PRODUCTS', 'scroll'],
    ['articles', 'JOURNAL', 'scroll'],
    ['about', 'ABOUT US', 'scroll'],
    ['contact', 'CONTACT', 'scroll'],
    ['quotation', 'QUOTATION', 'page'],
  ];

  return (
    <nav className={`sticky top-0 z-40 bg-[#0A0E16]/95 backdrop-blur-sm border-b border-silver/10 transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-[2px] w-full bg-gold origin-left will-change-transform" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />
      <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3">
        <a href="/" onClick={(e) => { setOpen(false); scrollToSection(e, '#home'); }} className="flex items-center gap-3">
          <img src="/images/logo-gold.webp" alt="Diamond Palace Pvt. Ltd." className="h-10 w-auto" width="420" height="279" />
          <span className="font-display text-xl tracking-[0.14em] text-silverhi leading-none">
            DP<span className="text-gold">PL</span>
            <small className="block font-body text-[0.5rem] tracking-[0.3em] text-steel mt-1">NEW ROAD · KATHMANDU</small>
          </span>
        </a>
        <ul className="hidden md:flex gap-8 items-center">
          {links.map(([href, label, kind]) => (
            <li key={href}>
              <a
                href={href === 'home' ? '/' : href === 'articles' ? '/articles' : href === 'quotation' ? '/quotation' : `/#${href}`}
                onClick={(e) => { if (kind !== 'page') scrollToSection(e, href); }}
                className="block py-1 text-[0.72rem] tracking-[0.22em] text-silver/90 transition-colors duration-300 hover:text-gold"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="md:hidden border border-silver/25 rounded-lg p-2.5 text-silver transition-colors hover:border-gold hover:text-gold"
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

            <div className={`md:hidden absolute top-full left-0 right-0 z-50 origin-top transition-all duration-300 ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
        <ul className="bg-[#05080F] border-b border-gold/30 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] py-2">
          {links.map(([href, label, kind]) => (
            <li key={href}>
              <a
                href={href === 'home' ? '/' : href === 'articles' ? '/articles' : href === 'quotation' ? '/quotation' : `/#${href}`}
                onClick={(e) => { setOpen(false); if (kind !== 'page') scrollToSection(e, href); }}
                className="block px-6 py-4 text-center text-[0.8rem] tracking-[0.24em] text-silver transition-colors hover:text-gold hover:bg-silver/[0.04]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
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
      <Nav />
      <Ticker />

            <section id="home" className="px-3 sm:px-6 md:px-12 pt-5 sm:pt-10 pb-8 sm:pb-12">
        <div className="frame grid lg:grid-cols-2 gap-10 lg:gap-12 items-center max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv className="order-2 lg:order-1">
            <Ledger>Rates · New Road ledger</Ledger>
            <p className="eyebrow mb-6">Gold &amp; silver bullion · <b className="text-gold font-medium">24K · 999 fine</b> · Weighed before your eyes</p>
            <h1 className="engraved font-display text-silverhi leading-[1.1] text-[clamp(2.1rem,5.4vw,3.8rem)]">
              <span className="mask-line"><span className="mask-inner">Today's gold &amp; silver price,</span></span>
              <span className="mask-line"><span className="mask-inner mask-delay-1 text-gold">straight from New Road.</span></span>
            </h1>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a href="/#products" onClick={(e) => scrollToSection(e, '#products')} className="btn-gold">BROWSE SILVER</a>
              <a href={WA('Hello Diamond Palace Pvt. Ltd., I would like to know today\u2019s silver price.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP US</a>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 w-full max-w-[560px] mx-auto lg:mx-0 lg:max-w-none" data-rv data-rv-d="1">
            <PriceCard />
          </div>
        </div>
      </section>

            <section id="products" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>The collection</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3.2rem)]">Fine metal, by weight.</h2>
          </div>
          <p className="mt-5 max-w-2xl flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm leading-relaxed text-silver/80">
            <span className="hallmark mt-1" aria-hidden="true" />
            <span><b className="text-silverhi font-medium">Making charges, stated up front.</b> Gold bars are priced by weight at the day’s published gold rate plus a <b>fixed making charge per bar</b>. Silver bars and coins carry only a <b>minimal making charge</b>. Both are shown as their own line on your invoice and in every online quotation.</span>
          </p>
          <p data-rv className="mt-5 max-w-3xl flex items-start gap-3 rounded-xl border border-silver/15 bg-silver/[0.04] px-4 py-3.5 text-sm leading-relaxed text-silver/75">
            <span className="hallmark mt-1.5 shrink-0 scale-[0.7] opacity-70" aria-hidden="true" />
            <span><b className="text-silverhi font-medium">Product images are illustrative.</b> Stamping, finish and packaging of the bars and coins we hold may differ from the designs shown here. Weight and fineness are exactly as stated, and both are verified on the scale in front of you before you pay.</span>
          </p>
          <div data-rv className="mt-5 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gold/30 bg-[#080D18]/70 px-4 py-4">
            <p className="text-sm leading-relaxed text-silver/80 flex-1">
              <b className="text-silverhi font-medium">Need a written price?</b> Request a quotation online — choose your bars or coins, see the itemised price at today’s rate, and send it to us as a PDF on WhatsApp.
            </p>
            <a href="/quotation" className="btn-gold shrink-0">Request a quotation</a>
          </div>

          <div data-rv className="mt-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.10] to-transparent p-5 sm:p-7">
            <p className="flex items-center gap-3 text-[0.7rem] tracking-[0.26em] uppercase text-gold">
              <span className="hallmark scale-[0.7]" aria-hidden="true" />
              New — October 2026
            </p>
            <h3 className="mt-3 font-display text-silverhi text-[clamp(1.15rem,2.6vw,1.6rem)]">24-carat gold, now at the counter</h3>
            <p className="prose-justify mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-silver/80">
              After three years dealing in fine silver, Diamond Palace Pvt. Ltd. opened its gold counter in October 2026.
              We quote 24-carat gold — 99.9% pure, the investment standard — per tola and per 10 grams, against the same
              Kathmandu market reference shown at the top of this page. Gold is sold by weight, weighed in front of you,
              invoiced to the gram, and bought back at the published purchase rate. <b className="text-silverhi font-medium">Gold bars carry a
              fixed making charge per bar</b>, shown as its own line on your invoice and in every quotation. Available weights and
              jewellery-grade 22-carat pricing are quoted at the counter.
            </p>
            <p className="prose-justify mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-silver/80">
              <b className="text-silverhi font-medium">Raw gold for business.</b> We also supply raw gold to jewellers, goldsmiths and
              manufacturers, sold by weight at the day’s gold rate. Quantities are arranged directly with the counter.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={WA('Hello Diamond Palace Pvt. Ltd., I would like to enquire about 24-carat gold bars.')} target="_blank" rel="noopener noreferrer" className="btn-gold">Enquire about gold</a>
              <a href={WA('Hello Diamond Palace Pvt. Ltd., I would like to enquire about raw gold for business use.')} target="_blank" rel="noopener noreferrer" className="btn-line">Raw gold for business</a>
              <a href="tel:+97715915052" className="btn-line">Call the counter</a>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            {PRODUCTS.map((p, i) => (
              <article key={p.label} data-rv data-rv-d={String(i % 4)} className="group relative bg-white/[0.03] border border-silver/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.05]">
                <span className={`absolute top-3 right-3 z-10 rounded-full border px-2.5 py-1 text-[0.56rem] tracking-[0.22em] uppercase ${
                  p.seasonal
                    ? 'border-[#E0A05A]/50 bg-[#E0A05A]/15 text-[#E7B97A]'
                    : p.metal === 'gold'
                      ? 'border-gold/45 bg-gold/15 text-gold'
                      : 'border-silver/25 bg-silver/10 text-silver/80'
                }`}>{p.seasonal ? 'Dhanteras' : p.metal === 'gold' ? 'Gold' : 'Silver'}</span>
                <div className="bg-gradient-to-b from-white/[0.05] to-transparent px-6 pt-7 flex justify-center">
                  <img src={p.img} alt={p.alt} loading="lazy" decoding="async" width={p.w} height={p.h} data-parallax="0.05" className="parallax h-48 w-auto object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-xl text-silverhi">{p.name}</h3>
                  <p className="text-[0.62rem] tracking-[0.3em] uppercase text-gold/80 my-2">
                    {p.seasonal ? '999 fine · limited release' : p.metal === 'gold' ? '999.9 fine · 24 carat' : '999 fine'} · sealed &amp; stamped
                  </p>
                  <p className="text-sm text-silver/70 leading-relaxed flex-1">{p.desc}</p>
                  <p className="mt-4 text-[0.7rem] tracking-wide text-steel">
                    {p.metal === 'gold' ? 'Rate by weight · fixed making charge per bar'
                      : p.name.includes('Bar') || p.seasonal ? 'Rate by weight · minimal making charge'
                      : 'Sold by weight at the day’s rate'}
                  </p>
                  <a href={WA(p.msg)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-4">{p.label}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              {[['999', 'Fineness'], ['2080', 'Established B.S.'], ['4', 'Product formats'], ['100%', 'Invoiced sales']].map(([v, l]) => (
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
    </main>
  );
}
