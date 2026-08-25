import { useEffect, useState } from 'react';
import { formatAD, formatBS, toNepaliDigits } from '../lib/nepaliDate.js';

const fmt = (n) =>
  Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const I18N = {
  en: {
    sale: 'Sale', buy: 'Purchase', tola: '1 Tola', g10: '10 Gram',
    spread: 'Spread', live: 'Live', updated: 'Updated', unit: 'per tola',
    rs: (n) => 'Rs ' + fmt(n),
  },
  np: {
    sale: 'बिक्री', buy: 'खरिद', tola: '१ तोला', g10: '१० ग्राम',
    spread: 'अन्तर', live: 'लाइभ', updated: 'अद्यावधिक', unit: 'प्रति तोला',
    rs: (n) => 'रु ' + toNepaliDigits(fmt(n)),
  },
};

// shown until /api/silver responds
const FALLBACK = { tolaSale: 4360, tolaPurchase: 4300, g10Sale: 3738, g10Purchase: 3686.5 };

export default function PriceCard() {
  const [lang, setLang] = useState('en');
  const [p, setP] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(new Date());
  const t = I18N[lang];
  const np = lang === 'np';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/silver', { cache: 'no-store' });
        if (!r.ok) throw 0;
        const d = await r.json();
        if (alive) { setP(d); setLive(true); setNow(new Date()); }
      } catch { /* fallback stands */ }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    const vis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const updated = p?.fetchedAt
    ? new Date(p.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' })
    : null;
  const spread = Math.round((p.tolaSale - p.tolaPurchase) * 100) / 100;

  const Pan = ({ label, value, accent }) => (
    <div className="hanger flex-1 pt-6 text-center">
      <p className={`stamp mb-3 ${accent ? 'text-vermilion' : ''} ${np ? 'font-np tracking-[0.14em]' : ''}`}>{label}</p>
      <p className={`font-mono tnum font-medium text-ink leading-none text-[clamp(1.9rem,7vw,3.1rem)] ${np ? 'font-np' : ''}`}>
        {t.rs(value)}
      </p>
      <p className={`stamp mt-3 ${np ? 'font-np tracking-[0.14em]' : ''}`}>{t.unit}</p>
    </div>
  );

  return (
    <section className="panel p-5 sm:p-8" lang={np ? 'ne' : 'en'} aria-label="Today's silver rate">
      {/* the day, in both calendars */}
      <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex gap-1.5">
          {[['en', formatAD(now), false], ['np', formatBS(now), true]].map(([id, label, ne]) => (
            <button
              key={id}
              onClick={() => setLang(id)}
              aria-pressed={lang === id}
              lang={ne ? 'ne' : undefined}
              className={`font-mono text-[0.68rem] tracking-[0.1em] px-3 py-2 rounded-sm border transition-colors ${
                lang === id ? 'border-ink bg-ink text-sheet' : 'border-line text-mute hover:border-ink hover:text-ink'
              } ${ne ? 'font-np' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={`flex items-center gap-2 stamp ${live ? 'text-vermilion' : ''} ${np ? 'font-np' : ''}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-vermilion animate-pulse' : 'bg-mute'}`} />
          {t.live}
        </span>
      </header>

      {/* the balance — the instrument this whole trade runs on */}
      <div className="mt-8">
        <div className="beam" />
        <div className="relative flex items-start">
          <Pan label={t.sale} value={p.tolaSale} accent />
          {/* fulcrum */}
          <div className="relative w-px bg-line self-stretch mx-2">
            <span className="hallmark absolute -top-[5px] left-1/2 -translate-x-1/2 bg-card" />
          </div>
          <Pan label={t.buy} value={p.tolaPurchase} />
        </div>
      </div>

      {/* ten gram, and the spread between the pans */}
      <dl className="mt-8 pt-4 border-t border-line grid grid-cols-3 gap-3 text-center">
        <div>
          <dt className={`stamp ${np ? 'font-np' : ''}`}>{t.g10} · {t.sale}</dt>
          <dd className={`mt-1.5 font-mono tnum text-ink text-[clamp(0.95rem,2.6vw,1.15rem)] ${np ? 'font-np' : ''}`}>{t.rs(p.g10Sale)}</dd>
        </div>
        <div className="border-x border-line">
          <dt className={`stamp ${np ? 'font-np' : ''}`}>{t.spread}</dt>
          <dd className={`mt-1.5 font-mono tnum text-vermilion text-[clamp(0.95rem,2.6vw,1.15rem)] ${np ? 'font-np' : ''}`}>{t.rs(spread)}</dd>
        </div>
        <div>
          <dt className={`stamp ${np ? 'font-np' : ''}`}>{t.g10} · {t.buy}</dt>
          <dd className={`mt-1.5 font-mono tnum text-ink text-[clamp(0.95rem,2.6vw,1.15rem)] ${np ? 'font-np' : ''}`}>{t.rs(p.g10Purchase)}</dd>
        </div>
      </dl>

      {updated && (
        <p className={`mt-5 stamp ${np ? 'font-np tracking-[0.12em]' : ''}`}>
          {t.updated} {np ? toNepaliDigits(updated) : updated} NPT{p.source ? ` · ${p.source}` : ''}
        </p>
      )}
    </section>
  );
}
