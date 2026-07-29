import { useEffect, useState } from 'react';
import { formatAD, formatBS, toNepaliDigits } from '../lib/nepaliDate.js';

const fmtNum = (n) =>
  Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const I18N = {
  en: {
    head: "Today's Silver Price",
    sub: 'Kathmandu · New Road',
    thSale: 'SALE', thBuy: 'PURCHASE',
    rowTola: '1 Tola', rowG10: '10 Gram', fine: 'Fine Silver 999',
    note: 'Rates are set each morning from the official Kathmandu bullion market reference and confirmed at the counter. Sale = you buy from us · Purchase = we buy from you. Bar and grain prices follow these rates by weight; making charges are additional.',
    updated: 'Updated', live: 'LIVE',
    cur: (n) => 'Rs ' + fmtNum(n),
  },
  np: {
    head: 'आजको चाँदीको मूल्य',
    sub: 'काठमाडौँ · न्यू रोड',
    thSale: 'बिक्री', thBuy: 'खरिद',
    rowTola: '१ तोला', rowG10: '१० ग्राम', fine: 'शुद्ध चाँदी ९९९',
    note: 'दरहरू हरेक बिहान काठमाडौँ बुलियन बजारको आधिकारिक सन्दर्भ मूल्य अनुसार तय हुन्छन् र काउन्टरमा पुष्टि गरिन्छ। बिक्री = तपाईंले हामीबाट किन्ने मूल्य · खरिद = हामीले तपाईंबाट किन्ने मूल्य। बार तथा ग्रेनको मूल्य यिनै दरमा तौल अनुसार हुन्छ; बनाउने ज्याला अतिरिक्त लाग्छ।',
    updated: 'अद्यावधिक', live: 'लाइभ',
    cur: (n) => 'रु ' + toNepaliDigits(fmtNum(n)),
  },
};

// shown until /api/silver responds
const FALLBACK = { tolaSale: 4360, tolaPurchase: 4300, g10Sale: 3738, g10Purchase: 3686.5 };

export default function PriceCard() {
  const [lang, setLang] = useState('en');
  const [prices, setPrices] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(new Date());
  const t = I18N[lang];
  const np = lang === 'np';

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/silver', { cache: 'no-store' });
        if (!res.ok) throw 0;
        const d = await res.json();
        if (alive) { setPrices(d); setLive(true); setNow(new Date()); }
      } catch {}
    }
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    const vis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const updated = prices?.fetchedAt
    ? new Date(prices.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' })
    : null;

  const Tab = ({ id, label, ne }) => (
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

  const COLS = 'grid grid-cols-[1fr_1.15fr_1.15fr] items-center gap-2 sm:gap-3';

  const Pill = ({ v, buy }) => (
    <span
      className={`block w-full text-center rounded-xl border px-2 py-2.5 sm:py-3 font-mono tnum font-medium leading-none
        text-[clamp(1.1rem,3.4vw,1.5rem)] transition-colors duration-500
        ${buy
          ? 'bg-[#9FD8B4]/[0.08] border-[#9FD8B4]/40 text-[#9FD8B4]'
          : 'bg-gold/[0.12] border-gold/50 text-gold shadow-[inset_0_0_18px_rgba(216,179,106,0.08)]'}
        ${np ? 'font-np' : ''}`}
    >
      {t.cur(v)}
    </span>
  );

  return (
    <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gold/20 blur-3xl opacity-30 animate-[pulse_5s_ease-in-out_infinite] pointer-events-none" aria-hidden="true" />

      <div className="plate relative shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
        <div className="plate-in relative p-4 sm:p-7 overflow-hidden" lang={np ? 'ne' : 'en'}>
          <span className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full border border-gold/25 hidden sm:flex items-center justify-center font-mono text-[0.62rem] tracking-[0.2em] text-gold/45 -rotate-12 select-none" aria-hidden="true">999</span>

                    <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className={`font-display text-silverhi tracking-wide text-[clamp(1.25rem,3vw,1.6rem)] ${np ? 'font-np' : ''}`}>{t.head}</h2>
              <p className={`mt-1 text-[0.68rem] tracking-[0.3em] uppercase text-steel ${np ? 'font-np tracking-[0.18em]' : ''}`}>{t.sub}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[0.6rem] tracking-[0.24em] font-mono
              ${live ? 'border-[#3DDC84]/50 text-[#3DDC84]' : 'border-steel/40 text-steel'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-[#3DDC84] shadow-[0_0_8px_#3DDC84] animate-pulse' : 'bg-steel'}`} />
              {t.live}
            </span>
          </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-5" role="tablist" aria-label="Choose date and language">
            <Tab id="en" label={formatAD(now)} />
            <Tab id="np" label={formatBS(now)} ne />
          </div>

                    <div className={np ? 'font-np' : ''}>
            <div className={`${COLS} mb-2`}>
              <span className="text-[0.68rem] tracking-[0.24em] uppercase text-steel">{t.fine}</span>
              <span className="text-center text-[0.74rem] tracking-[0.3em] uppercase text-gold font-medium">{t.thSale}</span>
              <span className="text-center text-[0.74rem] tracking-[0.3em] uppercase text-[#9FD8B4] font-medium">{t.thBuy}</span>
            </div>
            <div className={`${COLS} py-2.5 border-t border-silver/10`}>
              <span className="text-silverhi text-[clamp(1rem,2.6vw,1.15rem)] tracking-wide">{t.rowTola}</span>
              <Pill v={prices.tolaSale} />
              <Pill v={prices.tolaPurchase} buy />
            </div>
            <div className={`${COLS} py-2.5 border-t border-silver/10`}>
              <span className="text-silverhi text-[clamp(1rem,2.6vw,1.15rem)] tracking-wide">{t.rowG10}</span>
              <Pill v={prices.g10Sale} />
              <Pill v={prices.g10Purchase} buy />
            </div>
          </div>

          <p className={`mt-4 text-[0.78rem] leading-relaxed text-steel ${np ? 'font-np' : ''}`}>
            {t.note}
            {updated && <> · {t.updated}: {np ? toNepaliDigits(updated) : updated} NPT{prices.source ? ` (${prices.source})` : ''}</>}
          </p>
        </div>
      </div>
    </div>
  );
}
