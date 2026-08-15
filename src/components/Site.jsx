import { useEffect, useRef, useState } from 'react';
import { Ticker, useReveal } from '../lib/ui.jsx';
import { ARTICLES } from '../content/articles.js';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';

const WA = (msg) => `https://wa.me/9779805617932?text=${encodeURIComponent(msg)}`;
const MAPS_URL = 'https://maps.app.goo.gl/vi1fuUN78UcsuRTA7';

const PhoneIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

const WaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7-3.9-3.4-4-3.6-.9-1.2-.9-2.3.6-1.6.8-1.8.4-.3.6-.3h.4c.2 0 .4-.1.6.4l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7s.8 1.3 1.7 2.1c1.2 1 2.1 1.3 2.4 1.5s.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.2.5.2.6.4s0 .9-.4 1.5z" /></svg>
);

const PRODUCTS = [
  { name: '100 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 100 gram fine silver bar 999', label: 'ENQUIRE · 100 G', msg: 'Hello DPPL, I would like to enquire about a 100g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The classic first holding — pocket-scale weight with the full DPPL diamond stamp. Ideal for gifting, savings, and starting a position.' },
  { name: '500 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 500 gram fine silver bar 999', label: 'ENQUIRE · 500 G', msg: 'Hello DPPL, I would like to enquire about a 500g Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The investor\u2019s workhorse — meaningful weight at a tighter premium per gram, without the handling bulk of a kilo.' },
  { name: '1 kg Silver Bar', img: '/images/bar.webp', alt: 'DPPL 1 kilogram fine silver bar 999', label: 'ENQUIRE · 1 KG', msg: 'Hello DPPL, I would like to enquire about a 1kg Fine Silver Bar (999). Please share today\u2019s price and making charges.', desc: 'The lowest premium per gram in the house. Preferred by serious investors and businesses accumulating in size.' },
  { name: 'Silver Grains', img: '/images/grains.webp', alt: 'DPPL silver grains 999 fine silver, 1 kg pack', label: 'ENQUIRE · GRAINS', msg: 'Hello DPPL, I would like to enquire about Silver Grains (999 fine). Please share today\u2019s price.', desc: 'Loose fine-silver grain for jewellers, manufacturers, and ritual use — sold to the exact gram you need, no more.' },
];


// scroll to the section and put its own path in the address bar — /contact,
// /products and so on, each of which is also a real page if reloaded
const scrollToSection = (e, href) => {
  const id = href.replace('#', '').replace('/', '');
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  catch { scrollTo(0, el.offsetTop || 0); }
  history.replaceState(null, '', '/' + id);
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
    const onScroll = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      if (openRef.current) setOpen(false);                    // scrolling dismisses the menu
      if (y > lastY.current + 6 && y > 90) setHidden(true);   // scrolling down → tuck away
      else if (y < lastY.current - 4 || y < 90) setHidden(false); // scrolling up → return
      lastY.current = y;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('keydown', onKey); };
  }, []);

  const links = [['home', 'HOME'], ['products', 'PRODUCTS'], ['about', 'ABOUT US'], ['contact', 'CONTACT']];

  return (
    <nav className={`sticky top-0 z-40 bg-[#0A0E16]/95 backdrop-blur-xl border-b border-silver/10 transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-[2px] bg-gold" aria-hidden="true" />
      <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3">
        <a href="/home" onClick={(e) => { setOpen(false); scrollToSection(e, '#home'); }} className="flex items-center gap-3">
          <img src="/images/logo.webp" alt="DPPL seal logo" className="w-11 h-11 rounded-full" width="44" height="44" />
          <span className="font-display text-xl tracking-[0.14em] text-silverhi leading-none">
            DP<span className="text-gold">PL</span>
            <small className="block font-body text-[0.5rem] tracking-[0.3em] text-steel mt-1">NEW ROAD · KATHMANDU</small>
          </span>
        </a>
        <ul className="hidden md:flex gap-8 items-center">
          {links.map(([href, label]) => (
            <li key={href}>
              <a href={`/${href}`} onClick={(e) => scrollToSection(e, href)} className="block py-1 text-[0.72rem] tracking-[0.22em] text-steel transition-colors hover:text-gold">{label}</a>
            </li>
          ))}
          <li><a href="/articles" className="block py-1 text-[0.72rem] tracking-[0.22em] text-steel transition-colors hover:text-gold">JOURNAL</a></li>
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
          {links.map(([href, label]) => (
            <li key={href}>
              <a
                href={`/${href}`}
                onClick={(e) => { setOpen(false); scrollToSection(e, href); }}
                className="block px-6 py-4 text-center text-[0.8rem] tracking-[0.24em] text-silver transition-colors hover:text-gold hover:bg-silver/[0.04]"
              >
                {label}
              </a>
            </li>
          ))}
          <li><a href="/articles" onClick={() => setOpen(false)} className="block px-6 py-4 text-center text-[0.8rem] tracking-[0.24em] text-silver transition-colors hover:text-gold hover:bg-silver/[0.04]">JOURNAL</a></li>
        </ul>
      </div>
    </nav>
  );
}

function AdSlot() {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  return (
    <div className="mt-10 min-h-[90px] flex items-center justify-center border border-dashed border-silver/15 rounded-xl">
            <ins className="adsbygoogle block w-full" data-ad-client="ca-pub-6267575917692101" data-ad-slot="0000000000" data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

export default function Site() {
  useReveal();
  return (
    <main className="relative z-10 bg-[#0B0F16]">
      <a href="/home" onClick={(e) => scrollToSection(e, '#home')} className="skip-link">Skip to content</a>
      <Nav />
      <Ticker />

            <section id="home" className="px-3 sm:px-6 md:px-12 pt-5 sm:pt-10 pb-8 sm:pb-12">
        <div className="frame grid lg:grid-cols-2 gap-10 lg:gap-12 items-center max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv className="order-2 lg:order-1">
            <Ledger>Rates · New Road ledger</Ledger>
            <p className="eyebrow mb-6">Silver bullion · <b className="text-gold font-medium">999 fine</b> · Weighed before your eyes</p>
            <h1 className="engraved font-display text-silverhi leading-[1.1] text-[clamp(2.1rem,5.4vw,3.8rem)]">
              Today's silver price, <em className="not-italic text-gold">straight from New Road.</em>
            </h1>
            <p className="mt-5 max-w-xl text-silver/75 leading-relaxed">
              DPPL publishes the daily sale and purchase rate for fine silver and supplies 999 bars and grains from the heart of Kathmandu's original street of commerce. Every piece is weighed on calibrated scales, sealed at the counter, and invoiced to the gram.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a href="/products" onClick={(e) => scrollToSection(e, '#products')} className="btn-gold">BROWSE SILVER</a>
              <a href={WA('Hello DPPL, I would like to know today\u2019s silver price.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP US</a>
            </div>
          </div>
          <div className="relative order-1 lg:order-2" data-rv data-rv-d="1">
            <PriceCard />
          </div>
        </div>
      </section>

            <section id="products" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>The collection</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3.2rem)]">Fine silver, four ways.</h2>
          </div>
          <p className="mt-3 max-w-xl text-silver/75 leading-relaxed">Every DPPL piece is 999 fine, stamped with the diamond mark, and sealed at Sasa Complex. Tap ENQUIRE to reach us directly on WhatsApp.</p>
          <p className="mt-5 max-w-2xl flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-sm leading-relaxed text-silver/80">
            <span className="hallmark mt-1" aria-hidden="true" />
            <span><b className="text-silverhi font-medium">Making charges apply on bars.</b> Prices are calculated from the day’s published silver rate by weight and are <b>exclusive of making charges</b>, which are added at the counter and shown on your invoice.</span>
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            {PRODUCTS.map((p, i) => (
              <article key={p.label} data-rv data-rv-d={String(i % 4)} className="group relative bg-white/[0.03] border border-silver/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.05]">
                <div className="bg-gradient-to-b from-white/[0.05] to-transparent px-6 pt-7 flex justify-center">
                  <img src={p.img} alt={p.alt} loading="lazy" className="h-48 w-auto object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-xl text-silverhi">{p.name}</h3>
                  <p className="text-[0.62rem] tracking-[0.3em] uppercase text-gold/80 my-2">999 fine · sealed &amp; stamped</p>
                  <p className="text-sm text-silver/70 leading-relaxed flex-1">{p.desc}</p>
                  {p.name.includes('Bar') && <p className="mt-4 text-[0.7rem] tracking-wide text-steel">Rate by weight · making charges extra</p>}
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
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Understand silver before you buy it.</h2>
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
          <img data-rv src="/images/logo.webp" alt="DPPL official seal — est. 2080 B.S., Kathmandu" loading="lazy" className="w-52 md:w-64 rounded-3xl mx-auto transition-transform duration-500 hover:rotate-3" />
          <div data-rv>
            <Ledger>Provenance</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">DPPL</h2>
            <p className="mt-4 max-w-3xl text-silver/80 leading-loose text-[0.95rem]">
              DPPL was established in 2080 B.S. with a simple conviction: that buying silver in Nepal should be as transparent as buying rice. From the 5th floor of Sasa Complex on New Road — the street where Kathmandu has traded for over a century — we deal in one thing only: fine silver, 999 purity, in bars of 100 g, 500 g, and 1 kg, and in loose grains for jewellers and manufacturers.
            </p>
            <p className="mt-4 max-w-3xl text-silver/80 leading-loose text-[0.95rem]">
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

            <section id="contact" className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 p-5 sm:p-8 md:p-12">
          <div data-rv>
            <Ledger>The counter</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Visit the counter.</h2>
            <address className="mt-6 not-italic text-lg leading-relaxed text-silver/85">
              <b className="text-gold font-medium">DPPL</b><br />5th Floor, Sasa Complex<br />New Road, Kathmandu 44600, Nepal
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
                <a href="tel:+9779805617932" className="tnum transition-colors hover:text-gold">+977 980-561-7932</a>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] tracking-[0.24em] text-gold/80">EMAIL</span>
                <a href="mailto:dppl2080@gmail.com" className="break-all transition-colors hover:text-gold">dppl2080@gmail.com</a>
              </li>
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a href="tel:+97715915052" className="btn-gold inline-flex items-center justify-center gap-2"><PhoneIcon /> CALL US</a>
              <a href={WA('Hello DPPL, I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP</a>
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
          <img src="/images/logo.webp" alt="DPPL seal" className="w-10 h-10 rounded-full" />
          <p className="text-xs text-steel leading-relaxed tracking-wide">
            <span className="font-display text-silver tracking-[0.14em] text-sm">DPPL</span><br />Est. 2080 B.S.
          </p>
        </div>
          <div className="text-xs text-steel leading-relaxed tracking-wide sm:text-right">
            <p>5th Floor, Sasa Complex, New Road, Kathmandu<br />© 2026 DPPL. All rights reserved.</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              <a href="/privacy/" className="transition-colors hover:text-gold">Privacy Policy</a>
              <a href="/terms/" className="transition-colors hover:text-gold">Terms of Use</a>
              <a href="mailto:dppl2080@gmail.com" className="transition-colors hover:text-gold">dppl2080@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
