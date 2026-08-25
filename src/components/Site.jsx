import { useEffect, useRef, useState } from 'react';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';
import { Ticker, useReveal } from '../lib/ui.jsx';
import { ARTICLES } from '../content/articles.js';

const WA = (msg) => `https://wa.me/9779805617932?text=${encodeURIComponent(msg)}`;
const MAPS_URL = 'https://maps.app.goo.gl/vi1fuUN78UcsuRTA7';

// specimen data for the catalogue: what a buyer actually needs to compare
const SPECS = {
  '100 g Silver Bar': { weight: '100 g', tolas: '8.57 tola', best: 'First holding' },
  '500 g Silver Bar': { weight: '500 g', tolas: '42.87 tola', best: 'Steady accumulation' },
  '1 kg Silver Bar': { weight: '1,000 g', tolas: '85.74 tola', best: 'Lowest premium per gram' },
  'Silver Grains': { weight: 'By weight', tolas: 'To the gram', best: 'Jewellers & industry' },
};

const scrollToSection = (e, href) => {
  const id = href.replace('#', '').replace('/', '');
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
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
  ['about', 'House', 'scroll'],
  ['contact', 'Visit', 'scroll'],
];

/* A section opens with its label sitting on a full-width rule, the way a
   drawing sheet is annotated. */
function Head({ label, title, lede, children }) {
  return (
    <div data-rv>
      <div className="flex items-center gap-4 border-t border-ink pt-3">
        <span className="hallmark" aria-hidden="true" />
        <span className="stamp text-ink">{label}</span>
      </div>
      <h2 className="title mt-8 text-[clamp(1.9rem,5vw,3.4rem)] max-w-3xl">{title}</h2>
      {lede && <p className="mt-5 max-w-xl text-body/90">{lede}</p>}
      {children}
    </div>
  );
}

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
      if (openRef.current) setOpen(false);
      if (y > lastY.current + 6 && y > 120) setHidden(true);
      else if (y < lastY.current - 4 || y < 120) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('keydown', onKey); };
  }, []);

  return (
    <nav className={`sticky top-0 z-40 bg-sheet/95 backdrop-blur border-b border-line transition-transform duration-300 ${hidden && !open ? '-translate-y-full' : ''}`}>
      <div ref={bar} className="absolute top-0 left-0 h-[2px] bg-vermilion" aria-hidden="true" />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 flex items-center justify-between gap-6 py-3.5">
        <a href="/home" onClick={(e) => { setOpen(false); scrollToSection(e, 'home'); }} className="flex items-center gap-3 group">
          <img src="/images/logo.webp" alt="" width="40" height="40" className="w-10 h-10" />
          <span className="leading-none">
            <span className="block font-display font-bold text-ink text-lg tracking-[0.08em]">DPPL</span>
            <span className="block stamp mt-1 text-[0.58rem]">Bullion · New Road</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-9">
          {NAV.map(([href, label, kind]) => (
            <li key={href}>
              <a href={`/${href}`} onClick={kind === 'page' ? undefined : (e) => scrollToSection(e, href)}
                 className="font-mono text-[0.7rem] tracking-[0.18em] uppercase text-mute hover:text-ink transition-colors">
                {label}
              </a>
            </li>
          ))}
          <li>
            <a href={WA('Hello DPPL, I would like to enquire about silver.')} target="_blank" rel="noopener noreferrer" className="btn-solid !px-5 !py-2.5">Enquire</a>
          </li>
        </ul>

        <button className="md:hidden border border-line p-2.5 text-ink rounded-sm" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open
            ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        </button>
      </div>

      <div className={`md:hidden absolute top-full left-0 right-0 z-50 origin-top transition-all duration-300 ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
        <ul className="bg-card border-b border-line shadow-[0_20px_40px_-24px_rgba(20,22,26,0.4)]">
          {NAV.map(([href, label, kind]) => (
            <li key={href} className="border-t border-line first:border-0">
              <a href={`/${href}`} onClick={kind === 'page' ? () => setOpen(false) : (e) => { setOpen(false); scrollToSection(e, href); }}
                 className="flex items-center justify-between px-6 py-4 font-mono text-[0.78rem] tracking-[0.18em] uppercase text-ink">
                {label}<span className="text-vermilion" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// Ad units go in once AdSense approves the site and issues a slot ID.
const AD_SLOT = '';
function AdSlot() {
  useEffect(() => {
    if (!AD_SLOT) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  if (!AD_SLOT) return null;
  return (
    <div className="mt-12 min-h-[90px] flex items-center justify-center">
      <ins className="adsbygoogle block w-full" data-ad-client="ca-pub-6267575917692101" data-ad-slot={AD_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

export default function Site() {
  useReveal();
  const wrap = 'mx-auto max-w-[1400px] px-4 sm:px-8';

  return (
    <main className="relative z-10 bg-sheet">
      <a href="/home" onClick={(e) => scrollToSection(e, 'home')} className="skip-link">Skip to content</a>
      <Nav />
      <Ticker />

      {/* ── RATES ─────────────────────────────────────────────── */}
      <section id="home" className={`${wrap} pt-10 sm:pt-16 pb-14`}>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-6 order-2 lg:order-1 stag">
            <p className="stamp">New Road · Kathmandu · Est. 2080 B.S.</p>
            <h1 className="title mt-6 text-[clamp(2.4rem,7vw,4.6rem)]">
              Today's silver,<br />weighed and<br /><span className="text-vermilion">priced in the open.</span>
            </h1>
            <p className="mt-7 max-w-lg text-body/90">
              We publish the day's sale and purchase rate before you walk in, so you know what
              the metal costs and what we will pay for it back. Bars of 999 fine silver and loose
              grain, weighed on calibrated scales in front of you, invoiced to the gram.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/products" onClick={(e) => scrollToSection(e, 'products')} className="btn-solid">See the silver</a>
              <a href={WA('Hello DPPL, I would like to enquire about today\u2019s rate.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WhatsApp</a>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2" data-rv>
            <PriceCard />
            <p className="mt-4 stamp leading-relaxed">
              Rate confirmed at the counter · Bars carry making charges on top of metal weight
            </p>
          </div>
        </div>
      </section>

      {/* ── SILVER ────────────────────────────────────────────── */}
      <section id="products" className={`${wrap} py-14 sm:py-20`}>
        <Head
          label="The silver"
          title={<>Four ways to hold it.</>}
          lede="Every piece is 999 fine, stamped with the DPPL diamond, and sealed at the counter. Prices follow the day's rate by weight; making charges are added on top and itemised on your invoice."
        />

        <div className="mt-12 border-t border-line">
          {PRODUCTS.map((p, i) => {
            const spec = SPECS[p.name];
            return (
              <article key={p.label} data-rv data-rv-d={String(i % 3)} className="group grid md:grid-cols-12 gap-6 md:gap-8 items-center border-b border-line py-8">
                <div className="md:col-span-1 stamp">{String(i + 1).padStart(2, '0')}</div>
                <div className="md:col-span-3">
                  <div className="bg-card border border-line rounded-sm p-5 flex justify-center">
                    <img src={p.img} alt={p.alt} loading="lazy" width="700" height="933"
                         className="h-36 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.04]" />
                  </div>
                </div>
                <div className="md:col-span-5">
                  <h3 className="title text-[clamp(1.2rem,2.6vw,1.6rem)]">{p.name}</h3>
                  <p className="mt-3 text-[0.98rem] text-body/85 leading-relaxed">{p.desc}</p>
                </div>
                <div className="md:col-span-3 md:text-right">
                  <dl className="font-mono text-[0.7rem] tracking-[0.06em] text-mute space-y-1.5">
                    <div><dt className="inline">Weight </dt><dd className="inline text-ink">{spec.weight}</dd></div>
                    <div><dt className="inline">Tolas </dt><dd className="inline text-ink">{spec.tolas}</dd></div>
                    <div><dt className="inline">Fineness </dt><dd className="inline text-ink">999</dd></div>
                    <div><dt className="inline">Suits </dt><dd className="inline text-ink">{spec.best}</dd></div>
                  </dl>
                  <a href={WA(p.msg)} target="_blank" rel="noopener noreferrer" className="btn-out mt-5 w-full md:w-auto">
                    Enquire →
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── JOURNAL ───────────────────────────────────────────── */}
      <section id="articles" className={`${wrap} py-14 sm:py-20`}>
        <Head label="The journal" title={<>Know the metal<br />before you buy it.</>} />
        <ul className="mt-12 border-t border-line">
          {ARTICLES.slice(0, 4).map((a, i) => (
            <li key={a.slug} data-rv data-rv-d={String(i % 3)} className="border-b border-line">
              <a href={`/articles/${a.slug}`} className="group grid md:grid-cols-12 gap-4 md:gap-8 py-7 items-baseline">
                <span className="md:col-span-2 stamp">{a.category}</span>
                <h3 className="md:col-span-7 title text-[clamp(1.1rem,2.4vw,1.45rem)] group-hover:text-vermilion transition-colors">{a.title}</h3>
                <span className="md:col-span-2 stamp">{a.minutes} min read</span>
                <span className="md:col-span-1 md:text-right text-vermilion" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="/articles" className="btn-out mt-8">All {ARTICLES.length} articles</a>
        <AdSlot />
      </section>

      {/* ── HOUSE ─────────────────────────────────────────────── */}
      <section id="about" className={`${wrap} py-14 sm:py-20`}>
        <Head label="The house" title={<>A counter, not a<br />storefront.</>} />
        <div className="mt-12 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-5 text-body/90" data-rv>
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
          <dl className="lg:col-span-5 grid grid-cols-2 gap-px bg-line border border-line" data-rv data-rv-d="1">
            {[['999', 'Fineness'], ['2080', 'Established B.S.'], ['11.6638 g', 'One tola'], ['100%', 'Invoiced sales']].map(([v, l]) => (
              <div key={l} className="bg-sheet p-6">
                <dt className="font-mono tnum text-ink text-[clamp(1.2rem,3vw,1.7rem)]">{v}</dt>
                <dd className="stamp mt-2">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── QUESTIONS ─────────────────────────────────────────── */}
      <section id="faq" className={`${wrap} py-14 sm:py-20`}>
        <Head label="Questions" title={<>Buying silver<br />in Kathmandu.</>} />
        <div className="mt-12 border-t border-line">
          {FAQS.map((f, i) => (
            <details key={f.q} data-rv data-rv-d={String(i % 3)} className="group border-b border-line py-5">
              <summary className="flex items-start gap-4 cursor-pointer list-none">
                <span className="stamp mt-1.5 w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="flex-1 font-display uppercase text-ink text-[0.98rem] tracking-[0.02em] leading-snug group-hover:text-vermilion transition-colors">{f.q}</h3>
                <span className="text-vermilion text-lg leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-4 pl-12 pr-8 text-[0.98rem] text-body/85 leading-relaxed max-w-3xl">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── VISIT ─────────────────────────────────────────────── */}
      <section id="contact" className={`${wrap} py-14 sm:py-20`}>
        <Head label="Visit" title={<>The counter is on<br />the fifth floor.</>} />
        <div className="mt-12 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5" data-rv>
            <address className="not-italic text-[1.05rem] leading-relaxed text-ink">
              DPPL<br />5th Floor, Sasa Complex<br />New Road, Kathmandu 44600<br />Nepal
            </address>

            <dl className="mt-8 border-t border-line">
              {[
                ['Hours', <>Sun – Fri · 10:30–18:00 NPT<br /><span className="text-mute">Closed Saturdays &amp; public holidays</span></>],
                ['Counter', <a href="tel:+97715915052" className="ln tnum">01-5915052</a>],
                ['Mobile', <a href="tel:+9779805617932" className="ln tnum">+977 980-561-7932</a>],
                ['Email', <a href="mailto:dppl2080@gmail.com" className="ln break-all">dppl2080@gmail.com</a>],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-line py-3.5">
                  <dt className="stamp pt-1">{k}</dt>
                  <dd className="text-[0.98rem]">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="tel:+97715915052" className="btn-solid"><PhoneIcon /> Call the counter</a>
              <a href={WA('Hello DPPL, I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WhatsApp</a>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn-out">Google Maps ↗</a>
            </div>
          </div>

          <div className="lg:col-span-7 border border-line rounded-sm overflow-hidden min-h-[380px] relative bg-card" data-rv data-rv-d="1">
            <KathmanduMap className="absolute inset-0 w-full h-full" />
          </div>
        </div>
      </section>

      {/* ── COLOPHON ──────────────────────────────────────────── */}
      <footer className="border-t border-ink mt-6">
        <div className={`${wrap} py-12 grid md:grid-cols-12 gap-8`}>
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo.webp" alt="" width="40" height="40" className="w-10 h-10" />
              <span className="font-display font-bold text-ink text-lg tracking-[0.08em]">DPPL</span>
            </div>
            <p className="mt-4 text-[0.92rem] text-mute leading-relaxed">
              Silver bullion, weighed and invoiced at the counter.<br />New Road, Kathmandu · Est. 2080 B.S.
            </p>
            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                   className="w-9 h-9 border border-line rounded-sm flex items-center justify-center text-mute hover:text-vermilion hover:border-vermilion transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="md:col-span-2">
            <p className="stamp">Sections</p>
            <ul className="mt-4 space-y-2.5 text-[0.92rem]">
              {NAV.map(([href, label, kind]) => (
                <li key={href}>
                  <a href={`/${href}`} onClick={kind === 'page' ? undefined : (e) => scrollToSection(e, href)} className="ln">{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3">
            <p className="stamp">Journal</p>
            <ul className="mt-4 space-y-2.5 text-[0.92rem]">
              {ARTICLES.slice(0, 4).map((a) => (
                <li key={a.slug}><a href={`/articles/${a.slug}`} className="ln">{a.title}</a></li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <p className="stamp">Counter</p>
            <ul className="mt-4 space-y-2.5 text-[0.92rem]">
              <li><a href="tel:+97715915052" className="ln tnum">01-5915052</a></li>
              <li><a href="tel:+9779805617932" className="ln tnum">+977 980-561-7932</a></li>
              <li><a href="mailto:dppl2080@gmail.com" className="ln">dppl2080@gmail.com</a></li>
              <li><a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="ln">Sasa Complex, New Road ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line">
          <div className={`${wrap} py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 stamp`}>
            <p>© 2026 DPPL · All rights reserved</p>
            <p className="flex gap-5">
              <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
              <a href="/articles" className="hover:text-ink transition-colors">Journal</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
