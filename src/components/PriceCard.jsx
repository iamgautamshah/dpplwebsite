import { useEffect, useState } from 'react';
import { formatAD, formatBS, toNepaliDigits } from '../lib/nepaliDate.js';
import { getSilver } from '../lib/ui.jsx';

const fmtNum = (n) =>
  Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const I18N = {
  en: {
    head: "Today's Gold & Silver Price",
    gold: 'Gold 24K', silver: 'Silver 999',
    thSale: 'SALE', thBuy: 'PURCHASE',
    rowTola: '1 Tola', rowG10: '10 Gram', fine: 'Fine Silver 999',
    live: 'LIVE', checking: 'CHECKING', offline: 'UNAVAILABLE',
    fetching: 'Fetching today\u2019s rate\u2026',
    srcKago: 'Source: Kathmandu Gold and Silver Dealers\u2019 Association (KAGOSIDA).',
    srcFene: 'Source: Federation Of Nepal Gold & Silver Dealers\u2019 Association (FENEGOSIDA).',
    unavailable: 'Rate unavailable right now \u2014 please call the counter on 01-5915052 for today\u2019s price.',
    cur: (n) => 'Rs ' + fmtNum(n),
  },
  np: {
    head: 'आजको सुन र चाँदीको मूल्य',
    gold: 'सुन २४ क्यारेट', silver: 'चाँदी ९९९',
    thSale: 'बिक्री', thBuy: 'खरिद',
    rowTola: '१ तोला', rowG10: '१० ग्राम', fine: 'शुद्ध चाँदी ९९९',
    live: 'लाइभ', checking: 'जाँच हुँदै', offline: 'उपलब्ध छैन',
    fetching: 'आजको दर ल्याउँदै\u2026',
    srcKago: 'स्रोत: काठमाडौँ सुनचाँदी व्यवसायी संघ (कागोसिडा)।',
    srcFene: 'स्रोत: नेपाल सुनचाँदी व्यवसायी महासंघ (फेनेगोसिडा)।',
    unavailable: 'अहिले दर उपलब्ध छैन \u2014 आजको मूल्यको लागि ०१-५९१५०५२ मा फोन गर्नुहोस्।',
    cur: (n) => 'रु ' + toNepaliDigits(fmtNum(n)),
  },
};

// shown until /api/silver responds
const COLS = 'grid grid-cols-[0.72fr_1.24fr_1.24fr] items-center gap-2 sm:gap-3';

// The rows rise in once, when the page first arrives — never again on a data
// refresh or a remount, which would read as the figures blinking out.
let rowsPlayed = false;

/* Tab, Pill and Metal live at module scope on purpose. Declared inside the
   component they would be a new function — and so a new component type — on
   every render, which makes React throw the DOM away and build it again. The
   figures would blink out and re-animate each time the rate refreshed or the
   tab regained focus. */
const Tab = ({ id, label, ne, lang, setLang }) => (
  <button
    role="tab"
    aria-selected={lang === id}
    onClick={() => setLang(id)}
    lang={ne ? 'ne' : undefined}
    className={`rounded-2xl px-2.5 py-3.5 text-center transition-all duration-300 border ${
      lang === id
        ? 'bg-gold/15 border-gold shadow-[0_0_20px_rgba(216,179,106,0.12)]'
        : 'bg-silver/5 border-silver/20 hover:border-silver/40'
    }`}
  >
    <span className={`block font-medium text-silverhi leading-snug text-[clamp(0.88rem,2vw,1.02rem)] ${ne ? 'font-np' : ''}`}>{label}</span>
  </button>
);

const Pill = ({ v, buy, np, cur }) => (
  <span
    className={`block w-full text-center rounded-xl border px-1 sm:px-2 py-2.5 sm:py-3 font-mono tnum font-medium leading-none
      text-[clamp(0.74rem,3.5vw,1.5rem)] transition-colors duration-500
      ${!Number.isFinite(v)
        ? 'bg-silver/[0.04] border-silver/15 text-steel'
        : buy
          ? 'bg-[#9FD8B4]/[0.08] border-[#9FD8B4]/40 text-[#9FD8B4]'
          : 'bg-gold/[0.12] border-gold/50 text-gold shadow-[inset_0_0_18px_rgba(216,179,106,0.08)]'}
      ${np ? 'font-np' : ''}`}
  >
    <span className="whitespace-nowrap">{Number.isFinite(v) ? cur(v) : <span className="opacity-40">—</span>}</span>
  </span>
);

/* One metal's two rows, under its own heading. Gold is only rendered when the
   board carries it, so a silver-only source still looks deliberate. */
const Metal = ({ label, tolaSale, tolaBuy, g10Sale, g10Buy, loaded, np, t }) => {
  if (loaded && !Number.isFinite(tolaSale)) return null;
  return (
    <div className="mt-3 first:mt-0">
      <p className={`flex items-center gap-2.5 text-[0.7rem] tracking-[0.26em] uppercase text-silver/70 ${np ? 'font-np tracking-[0.1em]' : ''}`}>
        <span className="hallmark scale-[0.62] opacity-80" aria-hidden="true" />
        {label}
      </p>
      <div className={`${COLS} py-2 sm:py-2.5 border-t border-silver/10 mt-1.5`}>
        <span className="text-silverhi text-[clamp(0.78rem,2.3vw,1.08rem)] tracking-wide">{t.rowTola}</span>
        <Pill v={tolaSale} np={np} cur={t.cur} />
        <Pill v={tolaBuy} buy np={np} cur={t.cur} />
      </div>
      <div className={`${COLS} py-2 sm:py-2.5 border-t border-silver/10`}>
        <span className="text-silverhi text-[clamp(0.78rem,2.3vw,1.08rem)] tracking-wide">{t.rowG10}</span>
        <Pill v={g10Sale} np={np} cur={t.cur} />
        <Pill v={g10Buy} buy np={np} cur={t.cur} />
      </div>
    </div>
  );
};

export default function PriceCard() {
  const [lang, setLang] = useState('en');
  const [prices, setPrices] = useState(null);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(new Date());
  // read once on mount, so a later render cannot re-trigger the entry animation
  const [animate] = useState(() => {
    if (rowsPlayed) return false;
    rowsPlayed = true;
    return true;
  });
  const t = I18N[lang];
  const np = lang === 'np';

  useEffect(() => {
    let alive = true;
    let retries = [];
    // shared with the ticker, so the page makes one request, not two
    const load = (refresh, attempt = 0) =>
      getSilver(refresh)
        .then((d) => {
          if (!alive) return;
          setPrices(d);
          setLive(true);
          setFailed(false);
          setNow(new Date());
        })
        .catch(() => {
          if (!alive) return;
          if (attempt < 3) {
            // 1s, 3s, 7s — covers a slow cold start or a dropped connection
            const wait = [1000, 3000, 7000][attempt];
            retries.push(setTimeout(() => load(true, attempt + 1), wait));
          } else {
            setFailed(true);
          }
        });
    load(false);
    const id = setInterval(() => load(true), 30 * 60 * 1000);
    const vis = () => document.visibilityState === 'visible' && load(true);
    document.addEventListener('visibilitychange', vis);
    return () => {
      alive = false;
      clearInterval(id);
      retries.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  return (
    <div className="relative card-stage">
            <div className="absolute -inset-2 rounded-[2rem] bg-gold/[0.07] blur-2xl pointer-events-none" aria-hidden="true" />

      <div className="drop-fall">
        <div className="drop-tip-right">
          <div className="drop-tip-left">
            <div className="plate drop-shade relative">
        <div className="plate-in relative p-3 sm:p-7 overflow-hidden" lang={np ? 'ne' : 'en'}>
          <span className="sheen" aria-hidden="true" />
          <span className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full border border-gold/25 hidden sm:flex items-center justify-center font-mono text-[0.62rem] tracking-[0.2em] text-gold/45 -rotate-12 select-none" aria-hidden="true">999</span>

                    <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className={`font-display text-silverhi tracking-wide text-[clamp(1.25rem,3vw,1.6rem)] ${np ? 'font-np' : ''}`}>{t.head}</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[0.6rem] tracking-[0.24em] font-mono
              ${live ? 'border-[#3DDC84]/50 text-[#3DDC84]' : failed ? 'border-[#E0A0A0]/50 text-[#E0A0A0]' : 'border-steel/40 text-steel'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-[#3DDC84] shadow-[0_0_8px_#3DDC84]' : failed ? 'bg-[#E0A0A0]' : 'bg-steel animate-pulse'}`} />
              {live ? t.live : failed ? t.offline : t.checking}
            </span>
          </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-5" role="tablist" aria-label="Choose date and language">
            <Tab id="en" label={formatAD(now)} lang={lang} setLang={setLang} />
            <Tab id="np" label={formatBS(now)} ne lang={lang} setLang={setLang} />
          </div>

                    <div className={`${animate ? 'rows-in' : ''} ${np ? 'font-np' : ''}`}>
            <div className={`${COLS} mb-2`}>
              <span aria-hidden="true" />
              <span className="text-center text-[0.74rem] tracking-[0.3em] uppercase text-gold font-medium">{t.thSale}</span>
              <span className="text-center text-[0.74rem] tracking-[0.3em] uppercase text-[#9FD8B4] font-medium">{t.thBuy}</span>
            </div>
            <Metal label={t.gold} tolaSale={prices?.gold?.tolaSale} tolaBuy={prices?.gold?.tolaPurchase}
                   g10Sale={prices?.gold?.g10Sale} g10Buy={prices?.gold?.g10Purchase}
                   loaded={!!prices} np={np} t={t} />
            <Metal label={t.silver} tolaSale={prices?.tolaSale} tolaBuy={prices?.tolaPurchase}
                   g10Sale={prices?.g10Sale} g10Buy={prices?.g10Purchase}
                   loaded={!!prices} np={np} t={t} />
          </div>
          <p className={`mt-4 text-[0.72rem] leading-relaxed ${failed ? 'text-[#E0A0A0]' : 'text-steel'} ${np ? 'font-np' : ''}`} aria-live="polite">
            {failed ? t.unavailable : !prices ? t.fetching : prices.source === 'KAGOSIDA' ? t.srcKago : t.srcFene}
          </p>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
