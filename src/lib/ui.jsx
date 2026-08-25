import { useEffect, useState } from 'react';

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-rv]');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

// live rate strip under the nav, pauses on hover
export function Ticker() {
  const [p, setP] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/silver', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setP(d))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const rs = (n) => 'Rs ' + (Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
  const items = p
    ? [
        `SILVER · 1 TOLA · SALE ${rs(p.tolaSale)}`,
        `PURCHASE ${rs(p.tolaPurchase)}`,
        `10 GRAM · SALE ${rs(p.g10Sale)}`,
        `PURCHASE ${rs(p.g10Purchase)}`,
        '999 FINE SILVER',
        'NEW ROAD · KATHMANDU',
      ]
    : ['999 FINE SILVER', 'WEIGHED BEFORE YOUR EYES', 'NEW ROAD · KATHMANDU', 'DAILY SALE & PURCHASE RATES', 'EST. 2080 B.S.'];

  const Run = () => (
    <span className="flex items-center shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 py-2.5 font-mono text-[0.64rem] tracking-[0.26em] whitespace-nowrap tnum">{it}</span>
          <span className="w-1 h-1 rotate-45 bg-vermilion" aria-hidden="true" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker bg-ink text-sheet" aria-label="Today's silver rate board">
      <div className="ticker-run">
        <Run /><Run /><Run /><Run />
      </div>
    </div>
  );
}
