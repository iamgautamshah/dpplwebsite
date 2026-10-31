import { useState } from 'react';
import { Footer, GoldShowcase, IMG, MAPS_URL, Nav, PhoneIcon, SilverShelf, WA, WaIcon } from './Site.jsx';
import PriceCard from './PriceCard.jsx';
import KathmanduMap from './KathmanduMap.jsx';

/* The frame every page except the home page shares: the site menu, a lit
   title band, the content, and the site footer. Products, Today's rate, the
   journal, About us, Contact and the legal pages all open in it, so moving
   between them always looks and behaves the same. */
export function Page({ current = null, title, intro, before = null, meta = null, narrow = false, children }) {
  return (
    <main className="relative z-10 bg-[#0B0F16] min-h-screen">
      <a href="#content" className="skip-link">Skip to content</a>
      <Nav current={current} />
      <header className="vault border-b border-gold/15">
        <div className={`${narrow ? 'max-w-3xl' : 'max-w-5xl'} mx-auto px-5 sm:px-8 md:px-12 pt-12 sm:pt-16 pb-10 sm:pb-12`}>
          {before}
          <h1 className="engraved font-display text-silverhi leading-[1.1] text-[clamp(1.9rem,4.6vw,3.1rem)]">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-silver/80">{intro}</p>}
          {meta}
        </div>
      </header>
      <div id="content" className={`${narrow ? 'max-w-3xl' : 'max-w-5xl'} mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-14`}>{children}</div>
      <Footer />
    </main>
  );
}

const H2 = ({ children, id }) => (
  <h2 id={id} className="font-display text-silverhi text-[clamp(1.3rem,3vw,1.75rem)] mt-12 first:mt-0 mb-4">{children}</h2>
);
const P = ({ children }) => <p className="prose-justify mt-4 text-[0.98rem] leading-relaxed text-silver/80 max-w-3xl">{children}</p>;
const A = ({ href, children }) => <a href={href} className="text-gold border-b border-gold/40 hover:border-gold">{children}</a>;

/* ── About ─────────────────────────────────────────────────────────────── */
export function AboutPage() {
  return (
    <Page
      current="about"
      title="About Diamond Palace Pvt. Ltd."
      intro="A gold and silver bullion counter on New Road, Kathmandu. We sell fine metal by weight, publish the day’s rates, and buy back what we sell."
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-10 items-start">
        <div>
          <H2>Who we are</H2>
          <P>
            Diamond Palace Pvt. Ltd. was established in 2080 B.S. and trades from the 5th floor of Sasa Complex on New Road,
            the street where Kathmandu has bought and sold precious metal for generations. We began with 999 fine silver:
            bars of 100 grams, 500 grams and a kilo, coins, and loose grains for jewellers and manufacturers. In October 2026
            we opened a gold counter for 24-carat gold bars and raw gold for business.
          </P>
          <P>
            We are a bullion dealer rather than a jeweller. What we sell is metal of a stated weight and fineness, priced from
            the day’s published rate. That keeps the price easy to check, and it is why we can buy the same metal back.
          </P>
        </div>
        <img src="/images/logo-gold-square.webp" alt="Diamond Palace Pvt. Ltd. seal, established 2080 B.S., Kathmandu" width="512" height="512" loading="lazy" decoding="async" className="w-44 md:w-56 rounded-3xl mx-auto" />
      </div>

      <H2>What we sell</H2>
      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        <div className="frame p-6 flex gap-5 items-center">
          <img src={IMG.gold.src} alt="24-carat gold bar" width={IMG.gold.w} height={IMG.gold.h} loading="lazy" className="h-28 w-auto drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]" />
          <div>
            <h3 className="font-display text-silverhi text-lg">Gold</h3>
            <p className="mt-2 text-sm leading-relaxed text-silver/75">24-carat (999.9) bars of 5 grams, 10 grams and 1 tola, and raw gold by weight for jewellers, goldsmiths and manufacturers.</p>
          </div>
        </div>
        <div className="frame p-6 flex gap-5 items-center">
          <img src={IMG.silverBar.src} alt="999 fine silver bar" width={IMG.silverBar.w} height={IMG.silverBar.h} loading="lazy" className="h-28 w-auto drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]" />
          <div>
            <h3 className="font-display text-silverhi text-lg">Silver</h3>
            <p className="mt-2 text-sm leading-relaxed text-silver/75">999 fine bars of 100 grams, 500 grams and 1000 grams, coins of 5 to 50 grams, and grains sold to the gram.</p>
          </div>
        </div>
      </div>

      <H2>How buying from us works</H2>
      <ol className="mt-5 space-y-4 max-w-3xl">
        {[
          ['Check the day’s rate.', <>The sale and purchase rates for gold and silver are published each morning. You can see them on our <A href="/rates">rate page</A>, or ask the counter on WhatsApp.</>],
          ['Ask for a quotation if you want it in writing.', <>The <A href="/quotation">online quotation form</A> itemises the metal, the making charge and any fee, and sends it to us as a PDF on WhatsApp.</>],
          ['Your piece is weighed in front of you.', 'Every bar, coin and gram of grain is weighed on calibrated scales at the counter before you pay.'],
          ['You pay the rate by weight plus the making charge.', 'Gold bars carry a fixed making charge per bar; silver bars and coins a minimal one. It is shown as its own line.'],
          ['You receive a full VAT invoice.', 'It records the weight, fineness, rate, making charge and date. Keep it: it is what makes the metal easy to sell back.'],
        ].map(([t, d], i) => (
          <li key={i} className="flex gap-4">
            <span className="shrink-0 w-8 h-8 rounded-full border border-gold/50 text-gold flex items-center justify-center text-sm tnum">{i + 1}</span>
            <div className="pt-1">
              <p className="text-silverhi font-medium">{t}</p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-silver/75">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <H2>Selling back to us</H2>
      <P>
        We buy back the bullion we have sold at the purchase rate published on the day you sell. Bring the metal and the
        original invoice. The piece is weighed and checked against the invoice, and payment is made at the counter. The
        making charge you paid when buying is not refunded, because what we buy back is the metal.
      </P>

      <H2>Where our rates come from</H2>
      <P>
        The rates we publish follow the Kathmandu bullion market reference set each morning by the Kathmandu Gold and
        Silver Dealers’ Association, with the Federation of Nepal Gold and Silver Dealers’ Association as the second
        source. One tola is 11.6638 grams. You can read more about how the rate is set in the <A href="/articles">journal</A>.
      </P>

      <div className="mt-12 flex flex-wrap gap-3">
        <a href="/contact" className="btn-gold">Visit the counter</a>
        <a href="/products" className="btn-line">See the bullion</a>
      </div>
    </Page>
  );
}

/* ── Contact ───────────────────────────────────────────────────────────── */
export function ContactPage() {
  return (
    <Page
      current="contact"
      title="Contact and visit the counter"
      intro="Come to the counter on New Road, call, or message us on WhatsApp. We answer questions about rates, weights and availability."
    >
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <H2>Address</H2>
          <address className="not-italic text-[1.05rem] leading-relaxed text-silver/85">
            <b className="text-gold font-medium">Diamond Palace Pvt. Ltd.</b><br />
            5th Floor, Sasa Complex<br />
            New Road, Kathmandu 44600<br />
            Nepal
          </address>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-gold border-b border-gold/40 hover:border-gold">Open in Google Maps</a>

          <H2>Opening hours</H2>
          <table className="text-[0.98rem] text-silver/85">
            <tbody>
              <tr><th scope="row" className="pr-6 py-1 text-left font-normal text-silver/60">Sunday to Friday</th><td className="tnum">10:30 to 18:00 (Nepal time)</td></tr>
              <tr><th scope="row" className="pr-6 py-1 text-left font-normal text-silver/60">Saturday</th><td>Closed</td></tr>
              <tr><th scope="row" className="pr-6 py-1 text-left font-normal text-silver/60">Public holidays</th><td>Closed</td></tr>
            </tbody>
          </table>

          <H2>Phone, WhatsApp and email</H2>
          <ul className="space-y-2.5 text-[0.98rem] text-silver/85">
            <li>Counter: <a href="tel:+97715915052" className="tnum text-silverhi hover:text-gold">01-5915052</a></li>
            <li>Mobile and WhatsApp: <a href="tel:+9779805617932" className="tnum text-silverhi hover:text-gold">+977 9805617932</a></li>
            <li>Email: <a href="mailto:dppl2080@gmail.com" className="text-silverhi hover:text-gold break-all">dppl2080@gmail.com</a></li>
          </ul>
          <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <a href="tel:+97715915052" className="btn-gold inline-flex items-center justify-center gap-2"><PhoneIcon /> Call the counter</a>
            <a href={WA('Hello Diamond Palace Pvt. Ltd., I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon /> WhatsApp us</a>
          </div>
        </div>
        <div className="border border-gold/30 rounded-2xl overflow-hidden min-h-[360px] md:min-h-full relative bg-[#0A0E15]">
          <KathmanduMap className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      <H2>Before you visit</H2>
      <ul className="mt-2 space-y-3 max-w-3xl text-[0.98rem] leading-relaxed text-silver/80 list-disc pl-5">
        <li>Check <A href="/rates">today’s rate</A>. The rate applied to a purchase is the one confirmed at the counter at the time of sale.</li>
        <li>For a written price in advance, use the <A href="/quotation">quotation form</A>. It asks for an ID number (National ID, citizenship, PAN or licence; PAN for businesses) and contact details so the quotation can be prepared in your name.</li>
        <li>Selling back? Bring the metal and the original invoice.</li>
        <li>For raw gold or larger silver orders for a business, call the counter first so the quantity can be arranged.</li>
      </ul>
    </Page>
  );
}

/* ── Products ──────────────────────────────────────────────────────────── */
export function ProductsPage() {
  return (
    <Page
      current="products"
      title="Gold and silver bullion"
      intro="24-carat gold bars and 999 fine silver bars, coins and grains, sold by weight at the day’s published rate from our counter on New Road, Kathmandu."
    >
      <GoldShowcase />
      <SilverShelf />
      <div className="mt-14 frame p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h2 className="font-display text-silverhi text-[clamp(1.2rem,2.6vw,1.5rem)]">Need a written price?</h2>
          <p className="mt-2 text-[0.98rem] leading-relaxed text-silver/80 max-w-2xl">
            Choose your bars or coins online and see the itemised price at today’s rate, with the making charge on its own
            line. The quotation is sent to us as a PDF on WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/quotation" className="btn-gold">Request a quotation</a>
          <a href="/rates" className="btn-line">Today’s rate</a>
        </div>
      </div>
    </Page>
  );
}

/* ── Today's rate, with the daily record ───────────────────────────────── */
// The middleware writes the record into the page for crawlers and into a
// JSON block for this component, so the table is the same before and after
// React takes over.
function readHistoryData() {
  if (typeof document === 'undefined') return null;
  try {
    const el = document.getElementById('rate-history-data');
    return el ? JSON.parse(el.textContent) : null;
  } catch {
    return null;
  }
}

const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const cell = (n) => (Number.isFinite(n) ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—');

export function HistoryTable({ rows }) {
  if (!rows || !rows.length) {
    return <p className="mt-4 text-[0.95rem] text-silver/65">The daily record starts from the first rate published after this page went live, and grows by one row each trading day.</p>;
  }
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-[640px] w-full text-[0.92rem]">
        <caption className="sr-only">Daily gold and silver rates in Nepal, newest first, in rupees</caption>
        <thead>
          <tr className="text-left text-silver/60 border-b border-silver/15">
            <th scope="col" className="py-2 pr-4 font-normal">Date</th>
            <th scope="col" className="py-2 pr-4 font-normal text-right">Gold 999.9 / tola</th>
            <th scope="col" className="py-2 pr-4 font-normal text-right">Gold 999.9 / 10 g</th>
            <th scope="col" className="py-2 pr-4 font-normal text-right">Silver 999 / tola</th>
            <th scope="col" className="py-2 font-normal text-right">Silver 999 / 10 g</th>
          </tr>
        </thead>
        <tbody className="tnum text-silver/85">
          {rows.map((r) => (
            <tr key={r.date} className="border-b border-silver/10">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-silverhi whitespace-nowrap">{dayLabel(r.date)}</th>
              <td className="py-2 pr-4 text-right">{r.gold ? cell(r.gold[0]) : '—'}</td>
              <td className="py-2 pr-4 text-right">{r.gold ? cell(r.gold[2]) : '—'}</td>
              <td className="py-2 pr-4 text-right">{cell(r.silver[0])}</td>
              <td className="py-2 text-right">{cell(r.silver[2])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-silver/50">Selling rates in rupees, as published by the Kathmandu bullion market each day.</p>
    </div>
  );
}

export function RatesPage() {
  const [rows] = useState(readHistoryData);
  return (
    <Page
      current="rates"
      title="Today’s gold and silver price in Nepal"
      intro="The day’s selling and buying rates for 24-carat gold and 999 fine silver, per tola and per 10 grams, with a record of past days."
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0"><PriceCard /></div>
        <div>
          <H2>Reading the rate board</H2>
          <P>
            <b className="text-silverhi font-medium">Sale</b> is the rate at which you buy; <b className="text-silverhi font-medium">purchase</b> is
            the rate at which metal is bought back from you. Each is given per tola (11.6638 grams) and per 10 grams. The rates
            are for the metal by weight; a making charge is added per bar or coin.
          </P>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/quotation" className="btn-gold">Request a quotation</a>
            <a href="/products" className="btn-line">See the bullion</a>
          </div>
        </div>
      </div>

      <H2 id="history">Daily record</H2>
      <div id="history-slot"><HistoryTable rows={rows} /></div>

      <H2>Where the rate comes from</H2>
      <P>
        Each morning the Kathmandu Gold and Silver Dealers’ Association publishes the reference rate for the Kathmandu market,
        and dealers across the valley price from it. We take our rates from that publication, with the Federation of Nepal
        Gold and Silver Dealers’ Association as the second source when the first is unavailable. The source is named on the
        rate board. If no rate has been published yet today, the board says so instead of showing yesterday’s figures.
      </P>

      <H2>What moves the price</H2>
      <P>
        Nepal’s rate follows the international price of gold and silver, converted into rupees, with import duties and costs
        added. A change in the world price or in the exchange rate shows up in the next morning’s rate. Our{' '}
        <A href="/articles/understanding-silver-prices-in-nepal">guide to how silver is priced in Nepal</A> and{' '}
        <A href="/articles/how-to-buy-gold-in-nepal">how to buy gold without being overcharged</A> explain this in more detail.
      </P>
    </Page>
  );
}
