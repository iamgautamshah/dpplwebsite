import { useEffect, useRef, useState } from 'react';
import { Ticker, useReveal } from '../lib/ui.jsx';
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
  { name: '100 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 100 gram fine silver bar 999', label: 'BUY · 100 G', msg: 'Hello DPPL, I want to buy a 100g Fine Silver Bar (999). Please share today\u2019s price.', desc: 'The classic first holding — pocket-scale weight with the full DPPL diamond stamp. Ideal for gifting, savings, and starting a position.' },
  { name: '500 g Silver Bar', img: '/images/bar.webp', alt: 'DPPL 500 gram fine silver bar 999', label: 'BUY · 500 G', msg: 'Hello DPPL, I want to buy a 500g Fine Silver Bar (999). Please share today\u2019s price.', desc: 'The investor\u2019s workhorse — meaningful weight at a tighter premium per gram, without the handling bulk of a kilo.' },
  { name: '1 kg Silver Bar', img: '/images/bar.webp', alt: 'DPPL 1 kilogram fine silver bar 999', label: 'BUY · 1 KG', msg: 'Hello DPPL, I want to buy a 1kg Fine Silver Bar (999). Please share today\u2019s price.', desc: 'The lowest premium per gram in the house. Preferred by serious investors and businesses accumulating in size.' },
  { name: 'Silver Grains', img: '/images/grains.webp', alt: 'DPPL silver grains 999 fine silver, 1 kg pack', label: 'BUY · GRAINS', msg: 'Hello DPPL, I want to buy Silver Grains (999 fine). Please share today\u2019s price.', desc: 'Loose fine-silver grain for jewellers, manufacturers, and ritual use — sold to the exact gram you need, no more.' },
];

const ARTICLES = [
  { cat: 'History', title: 'Silver in the world: five thousand years of money',
    teaser: 'Silver was money before coins existed. Mesopotamian merchants weighed out silver shekels four thousand years before Christ, and when the Lydians struck the world\u2019s first coins around 600 BCE, silver was in them. Athens built its navy on the silver mines of Laurion; Rome paid its legions in silver denarii.',
    more: 'The metal shaped whole eras. Spanish galleons carried Bolivian and Mexican silver across two oceans, and the eight-real coin — the "piece of eight" — became the first truly global currency, accepted from Manila to Boston. China ran its entire economy on silver for centuries. The word for money is still "argent" in French and "plata" in Spanish: literally, silver. In the modern age silver picked up a second life as an industrial metal — it is the best electrical conductor of any element, which puts it inside every solar panel, smartphone, and electric vehicle made today. That double identity, ancient money and modern technology, is what makes silver unlike any other asset: it has never in recorded history been worthless, and the industries of the future keep consuming it.' },
  { cat: 'History', title: 'Silver in Nepal: from Lichhavi coins to today\u2019s counter',
    teaser: 'Silver has circulated in the Kathmandu Valley for well over a millennium. Lichhavi and Malla kings struck silver coinage, and Malla-era Nepal even minted the silver mohar coins used across the Himalaya in Tibet — a trade so valuable that disputes over coin purity helped spark war between Kathmandu and Lhasa.',
    more: 'Beyond coinage, silver wove itself into daily Nepali life. Newar silversmiths of the Valley became famous across Asia for repouss\u00e9 work on temple doors, ritual vessels, and statue ornaments. A Nepali child still receives silver anklets and bangles; offerings to deities are made on silver plates; a daughter\u2019s dowry traditionally carries silver alongside gold. New Road itself — rebuilt after the great earthquake of 1990 B.S. — grew into the country\u2019s centre for precious-metal trade, where daily gold and silver prices have been set and shouted between shops for generations. When you buy a stamped bar at a New Road counter today, weighed in tolas as it was under the Mallas, you are participating in one of the oldest continuous markets in Nepal.' },
  { cat: 'Buying well', title: 'How to verify a silver bar before you pay for it',
    teaser: 'A genuine fine-silver bar tells you what it is. Look first for three stampings: the fineness (999), the weight, and the maker\u2019s mark — on DPPL bars, the diamond seal. If any of the three is missing or looks re-struck, walk away.',
    more: 'Second, insist on seeing the bar weighed in front of you on a calibrated scale — a 100 g bar should read 100.0, not "about a hundred." Third, ask for a full VAT invoice recording the weight, fineness, rate, and date; this is what makes the bar liquid, because any honest dealer in Nepal will buy back a documented bar at the day\u2019s purchase rate. Finally, be careful with deals that are far below the published rate. Silver is a commodity: nobody sells it meaningfully under the market unless something is wrong with the metal, the weight, or the paperwork. Paying the fair, published price with full documentation is the cheapest way to own silver in the long run.' },
  { cat: 'Investing', title: 'Why Kathmandu households are turning to silver',
    teaser: 'Gold gets the headlines, but silver has quietly become the practical metal for Nepali savers. The entry price is a fraction of gold\u2019s, the cultural uses — from ritual to jewellery — are just as deep, and the industrial demand behind it keeps growing.',
    more: 'Silver is consumed as well as saved: solar panels, electronics, and medical uses take a growing share of world supply each year, which gives the metal an industrial floor that pure store-of-value assets lack. For a household in Kathmandu, that means a 100 g bar bought today is both a hedge against rupee inflation and a claim on real industrial demand. The sensible pattern we see from experienced customers is steady accumulation — a fixed budget each month or each Dashain bonus, converted at the day\u2019s rate regardless of headlines — rather than trying to time the market. Silver rewards patience and punishes panic; buy documented metal, store it safely, and let the decades do the work.' },
];

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

  const links = [['#home', 'HOME'], ['#products', 'PRODUCTS'], ['#articles', 'ARTICLES'], ['#about', 'ABOUT US'], ['#contact', 'CONTACT']];

  return (
    <nav className={`sticky top-0 z-40 bg-[#0A0E16]/95 backdrop-blur-xl border-b border-silver/10 transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-[2px] bg-gold" aria-hidden="true" />
      <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3">
        <a href="#home" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/images/logo.webp" alt="DPPL seal logo" className="w-11 h-11 rounded-full" width="44" height="44" />
          <span className="font-display text-xl tracking-[0.14em] text-silverhi leading-none">
            DP<span className="text-gold">PL</span>
            <small className="block font-body text-[0.5rem] tracking-[0.3em] text-steel mt-1">NEW ROAD · KATHMANDU</small>
          </span>
        </a>
        <ul className="hidden md:flex gap-8">
          {links.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="block py-1 text-[0.72rem] tracking-[0.22em] text-steel transition-colors hover:text-gold">{label}</a>
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

      {/* mobile drawer — absolute under the bar, above everything */}
      <div className={`md:hidden absolute top-full left-0 right-0 z-50 origin-top transition-all duration-300 ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
        <ul className="bg-[#05080F] border-b border-gold/30 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] py-2">
          {links.map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setOpen(false)}
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

function AdSlot() {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* ok */ }
  }, []);
  return (
    <div className="mt-10 min-h-[90px] flex items-center justify-center border border-dashed border-silver/15 rounded-xl">
      {/* Replace data-ad-slot with your real slot ID from the AdSense console */}
      <ins className="adsbygoogle block w-full" data-ad-client="ca-pub-6267575917692101" data-ad-slot="0000000000" data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

export default function Site() {
  useReveal();
  return (
    <main className="relative z-10 bg-graphite">
      <a href="#home" className="skip-link">Skip to content</a>
      <Nav />
      <Ticker />

      {/* HOME */}
      <section id="home" className="px-4 sm:px-5 md:px-16 pt-8 sm:pt-14 pb-16 sm:pb-20 bg-[radial-gradient(1100px_560px_at_82%_-12%,rgba(216,179,106,0.13),transparent_60%),linear-gradient(180deg,#0A0F1A_0%,#111624_60%,#101520_100%)]">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center max-w-7xl mx-auto">
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
              <a href="#products" className="btn-gold">BROWSE SILVER</a>
              <a href={WA('Hello DPPL, I would like to know today\u2019s silver price.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP US</a>
            </div>
          </div>
          <div className="relative order-1 lg:order-2" data-rv data-rv-d="1">
            <span className="wm text-silver/[0.05] text-[clamp(7rem,18vw,13rem)] -top-14 -right-4" aria-hidden="true">999</span>
            <PriceCard />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="bg-ivory text-[#1C222E] px-5 md:px-16 py-20">
        <div className="max-w-7xl mx-auto relative">
          <span className="wm text-[#1C222E]/[0.06] text-[clamp(6rem,17vw,14rem)] -top-8 right-0" lang="ne" aria-hidden="true">चाँदी</span>
          <div data-rv>
            <Ledger light>The collection</Ledger>
            <h2 className="font-display text-[#141821] text-[clamp(2rem,4.6vw,3.2rem)]">Fine silver, four ways.</h2>
          </div>
          <p className="mt-3 max-w-xl text-[#4A4F5C] leading-relaxed">Every DPPL piece is 999 fine, stamped with the diamond mark, and sealed at Sasa Complex. Tap BUY to order directly on WhatsApp.</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            {PRODUCTS.map((p, i) => (
              <article key={p.label} data-rv data-rv-d={String(i % 4)} className="group relative bg-[#FDFBF5] border border-[#E4DECC] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-gold-deep/50 hover:shadow-[0_22px_44px_-18px_rgba(28,34,46,0.25)]">
                <span className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full border border-gold-deep/40 flex items-center justify-center font-mono text-[0.6rem] tracking-widest text-gold-deep rotate-12" aria-hidden="true">999</span>
                <div className="bg-gradient-to-b from-[#EFEBDD] to-[#FDFBF5] px-6 pt-6 flex justify-center">
                  <img src={p.img} alt={p.alt} loading="lazy" className="h-52 w-auto object-contain drop-shadow-[0_14px_20px_rgba(28,34,46,0.22)] transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-xl text-[#141821]">{p.name}</h3>
                  <p className="text-[0.64rem] tracking-[0.3em] uppercase text-gold-deep my-2">999 fine · sealed &amp; stamped</p>
                  <p className="text-sm text-[#5A5F6C] leading-relaxed flex-1">{p.desc}</p>
                  <a href={WA(p.msg)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-5">{p.label}</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section id="articles" className="bg-panel px-5 md:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <div data-rv>
            <Ledger>The DPPL Journal</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Understand silver before you buy it.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {ARTICLES.map((a, i) => (
              <article key={a.title} data-rv data-rv-d={String(i % 2)} className="bg-silver/[0.04] border border-silver/10 rounded-2xl p-7 transition-all duration-300 hover:border-gold/30 hover:bg-silver/[0.06]">
                <p className="text-[0.6rem] tracking-[0.34em] uppercase text-gold mb-3">{a.cat}</p>
                <h3 className="font-display text-xl text-silverhi leading-snug">{a.title}</h3>
                <p className="mt-3 text-sm text-silver/75 leading-relaxed">{a.teaser}</p>
                <details className="mt-3 group">
                  <summary className="cursor-pointer list-none text-[0.72rem] tracking-[0.22em] uppercase text-gold after:content-['_+'] group-open:after:content-['_−']">Read more</summary>
                  <p className="mt-3 text-sm text-silver/60 leading-relaxed">{a.more}</p>
                </details>
              </article>
            ))}
          </div>
          <AdSlot />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-graphite px-5 md:px-16 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[auto_1fr] gap-12 items-start">
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

      {/* CONTACT */}
      <section id="contact" className="bg-gradient-to-b from-graphite to-[#0A0F1A] px-5 md:px-16 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div data-rv>
            <Ledger>The counter</Ledger>
            <h2 className="engraved font-display text-silverhi text-[clamp(2rem,4.6vw,3rem)]">Visit the counter.</h2>
            <p className="mt-6 text-lg leading-loose text-silver/85">
              <b className="text-gold font-medium">DPPL</b><br />5th Floor, Sasa Complex<br />New Road, Kathmandu 44600, Nepal
            </p>
            <p className="mt-4 text-sm leading-loose text-steel">
              Sunday – Friday · 10:30 – 18:00 NPT<br />Closed Saturdays and public holidays — call ahead for large orders.<br />
              Counter: 01-5915052 · Mobile / WhatsApp: +977 980-561-7932 · dppl2080@gmail.com
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a href="tel:+97715915052" className="btn-gold inline-flex items-center gap-2"><PhoneIcon /> CALL 01-5915052</a>
              <a href="tel:+9779805617932" className="btn-line inline-flex items-center gap-2"><PhoneIcon /> CALL 980-561-7932</a>
              <a href={WA('Hello DPPL, I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WHATSAPP</a>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn-line">GOOGLE MAPS ↗</a>
              <a href="mailto:dppl2080@gmail.com" className="btn-line">EMAIL US</a>
            </div>
          </div>
          <div className="border border-gold/30 rounded-2xl overflow-hidden min-h-[340px] relative bg-[#0A0E15]">
            <KathmanduMap className="absolute inset-0 w-full h-full" />
          </div>
        </div>
      </section>

      <footer className="bg-[#080C14] border-t border-silver/[0.07] px-5 md:px-16 pt-14 pb-10">
        <p className="wm relative !static block text-center text-silver/[0.07] text-[clamp(4.5rem,16vw,12rem)] tracking-[0.08em] mb-8" aria-hidden="true">DPPL</p>
        <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <img src="/images/logo.webp" alt="DPPL seal" className="w-10 h-10 rounded-full" />
          <p className="text-xs text-steel leading-relaxed tracking-wide">
            <span className="font-display text-silver tracking-[0.14em] text-sm">DPPL</span><br />Est. 2080 B.S.
          </p>
        </div>
          <p className="text-xs text-steel leading-relaxed tracking-wide text-right">
            5th Floor, Sasa Complex, New Road, Kathmandu<br />© 2026 DPPL. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
