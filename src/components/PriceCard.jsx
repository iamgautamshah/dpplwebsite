import { useEffect, useState } from 'react';
import { formatAD, formatBS, toNepaliDigits } from '../lib/nepaliDate.js';
import { getSilver, useCountUp, useDesk } from '../lib/ui.jsx';

const fmt = (n) =>
  Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const I18N = {
  en: { sale: 'Sale', buy: 'Purchase', tola: '1 tola', g10: '10 gram', spread: 'Spread',
        unit: 'NPR / tola', src: 'Source', upd: 'Updated', open: 'Counter open', shut: 'Counter closed',
        copy: 'Copy rate', copied: 'Copied' },
  np: { sale: 'बिक्री', buy: 'खरिद', tola: '१ तोला', g10: '१० ग्राम', spread: 'अन्तर',
        unit: 'रु / तोला', src: 'स्रोत', upd: 'अद्यावधिक', open: 'काउन्टर खुला', shut: 'काउन्टर बन्द',
        copy: 'कपी', copied: 'कपी भयो' },
};

// shown until /api/silver responds
const FALLBACK = { tolaSale: 4360, tolaPurchase: 4300, g10Sale: 3738, g10Purchase: 3686.5 };

function Readout({ label, value, tone, np, rs }) {
  const shown = useCountUp(value);
  return (
    <div className="flex-1 min-w-0 p-3.5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-sm rotate-45 ${tone === 'sale' ? 'bg-sale' : 'bg-buy'}`} />
        <span className={`mono-label ${np ? 'font-np tracking-[0.12em]' : ''}`}>{label}</span>
      </div>
      <p className={`mt-2.5 sm:mt-3 font-mono tnum font-medium leading-none whitespace-nowrap text-[clamp(1.15rem,5.4vw,2.9rem)] ${tone === 'sale' ? 'text-sale' : 'text-buy'} ${np ? 'font-np' : ''}`}>
        {rs(Math.round(shown * 100) / 100)}
      </p>
    </div>
  );
}

export default function PriceCard() {
  const [lang, setLang] = useState('en');
  const [p, setP] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());
  const desk = useDesk();
  const t = I18N[lang];
  const np = lang === 'np';
  const rs = (n) => (np ? 'रु ' + toNepaliDigits(fmt(n)) : 'Rs ' + fmt(n));

  useEffect(() => {
    let alive = true;
    const load = (refresh) => getSilver(refresh).then((d) => {
      if (alive && d) { setP(d); setLive(true); setNow(new Date()); }
    });
    load(false);
    const id = setInterval(() => load(true), 30 * 60 * 1000);
    const vis = () => document.visibilityState === 'visible' && load(true);
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const updated = p?.fetchedAt
    ? new Date(p.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' })
    : null;
  const spread = Math.round((p.tolaSale - p.tolaPurchase) * 100) / 100;
  const spreadPct = ((spread / p.tolaSale) * 100).toFixed(2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `DPPL silver ${formatAD(now)} — sale Rs ${fmt(p.tolaSale)}/tola, purchase Rs ${fmt(p.tolaPurchase)}/tola`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <section className="panel-surface faceplate overflow-hidden" lang={np ? 'ne' : 'en'} aria-label="Today's silver rate">
      {/* instrument header: what this is, where it came from, is it live */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-line bg-raised/60">
        <div className="flex items-center gap-2.5">
          <span className={`pip w-2 h-2 rounded-full ${live ? 'bg-buy text-buy' : 'bg-mute text-mute'}`} />
          <span className="font-mono text-[0.64rem] sm:text-[0.68rem] tracking-[0.1em] sm:tracking-[0.14em] text-text">SILVER · 999</span>
          <span className="mono-label hidden sm:inline">{t.unit}</span>
        </div>
        <div className="flex items-center gap-2">
          {[['en', formatAD(now), false], ['np', formatBS(now), true]].map(([id, label, ne]) => (
            <button key={id} onClick={() => setLang(id)} aria-pressed={lang === id} lang={ne ? 'ne' : undefined}
              className={`font-mono text-[0.64rem] px-2.5 py-1.5 rounded transition-colors ${
                lang === id ? 'bg-signal/15 text-signal border border-signal/40' : 'border border-line text-mute hover:text-text'
              } ${ne ? 'font-np' : ''}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* the two figures that matter */}
      <div className="grid grid-cols-2 divide-x divide-line">
        <Readout label={t.sale} value={p.tolaSale} tone="sale" np={np} rs={rs} />
        <Readout label={t.buy} value={p.tolaPurchase} tone="buy" np={np} rs={rs} />
      </div>

      {/* the spread, drawn to scale between them */}
      <div className="px-3.5 sm:px-5 pb-4 sm:pb-5">
        <div className="flex items-center justify-between mono-label mb-2">
          <span className={np ? 'font-np' : ''}>{t.spread}</span>
          <span className="text-text tnum">{rs(spread)} · {spreadPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-raised overflow-hidden flex" role="img" aria-label={`Spread ${spread} rupees`}>
          <span className="bg-buy/70" style={{ width: `${100 - Number(spreadPct) * 6}%` }} />
          <span className="bg-sale/80 flex-1" />
        </div>
      </div>

      {/* ten gram, and the desk's own status line */}
      <dl className="grid grid-cols-2 border-t border-line divide-x divide-line">
        <div className="px-3.5 sm:px-5 py-3.5 sm:py-4 min-w-0">
          <dt className={`mono-label ${np ? 'font-np' : ''}`}>{t.g10} · {t.sale}</dt>
          <dd className={`mt-1.5 font-mono tnum text-text text-[0.95rem] sm:text-[1.05rem] whitespace-nowrap ${np ? 'font-np' : ''}`}>{rs(p.g10Sale)}</dd>
        </div>
        <div className="px-3.5 sm:px-5 py-3.5 sm:py-4 min-w-0">
          <dt className={`mono-label ${np ? 'font-np' : ''}`}>{t.g10} · {t.buy}</dt>
          <dd className={`mt-1.5 font-mono tnum text-text text-[0.95rem] sm:text-[1.05rem] whitespace-nowrap ${np ? 'font-np' : ''}`}>{rs(p.g10Purchase)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-line bg-raised/40 font-mono text-[0.58rem] sm:text-[0.62rem] tracking-[0.06em] sm:tracking-[0.1em] text-mute">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${desk.open ? 'bg-buy' : 'bg-mute'}`} />
          <span className={np ? 'font-np' : ''}>{desk.open ? t.open : t.shut}</span>
          <span className="text-text tnum">{desk.time} NPT</span>
        </span>
        <span className="flex items-center gap-3">
          {updated && <span>{t.upd} {np ? toNepaliDigits(updated) : updated}{p.source ? ` · ${p.source}` : ''}</span>}
          <button onClick={copy} className="hover:text-signal transition-colors" aria-label={t.copy}>
            {copied ? `✓ ${t.copied}` : '⧉'}
          </button>
        </span>
      </div>
    </section>
  );
}
