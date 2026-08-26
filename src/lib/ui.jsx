import { useEffect, useRef, useState } from 'react';

// one shared request for the day's rates; refresh() bypasses the cache
let cached = null;
export function getSilver(refresh = false) {
  if (refresh || !cached) {
    cached = fetch('/api/silver', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return cached;
}

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
      { threshold: 0.1 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

/** Kathmandu wall clock, ticking, plus whether the counter is open right now. */
export function useDesk() {
  const read = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'short', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
    const h = Number(get('hour')), m = Number(get('minute'));
    const day = get('weekday');
    const mins = h * 60 + m;
    // Sunday to Friday, 10:30–18:00 NPT
    const open = day !== 'Sat' && mins >= 630 && mins < 1080;
    return { time: `${get('hour')}:${get('minute')}:${get('second')}`, day, open };
  };
  const [desk, setDesk] = useState(read);
  useEffect(() => {
    const id = setInterval(() => setDesk(read()), 1000);
    return () => clearInterval(id);
  }, []);
  return desk;
}

/** Counts a figure up on first paint — the readout coming online. */
export function useCountUp(value, ms = 1100) {
  const [n, setN] = useState(value);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) { setN(value); return; }
    started.current = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return; }
    const t0 = performance.now();
    let raf = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      setN(value * ease(k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return n;
}

/** The rate strip that runs under the desk header. */
export function Ticker() {
  const [p, setP] = useState(null);
  useEffect(() => { let a = true; getSilver().then((d) => a && d && setP(d)); return () => { a = false; }; }, []);

  const rs = (n) => 'Rs ' + (Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
  const items = p
    ? [['SILVER 999', ''], ['1 TOLA SALE', rs(p.tolaSale)], ['1 TOLA BUY', rs(p.tolaPurchase)],
       ['10 G SALE', rs(p.g10Sale)], ['10 G BUY', rs(p.g10Purchase)], ['NEW ROAD · KTM', '']]
    : [['SILVER 999', ''], ['WEIGHED BEFORE YOUR EYES', ''], ['NEW ROAD · KTM', ''], ['EST. 2080 B.S.', '']];

  const Run = () => (
    <span className="flex items-center shrink-0" aria-hidden="true">
      {items.map(([k, v], i) => (
        <span key={i} className="flex items-center gap-2.5 px-5 py-2 font-mono text-[0.66rem] tracking-[0.14em] whitespace-nowrap">
          <span className="text-mute">{k}</span>
          {v && <span className="text-text tnum">{v}</span>}
          <span className="w-1 h-1 rotate-45 bg-signal/60 ml-2.5" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker border-y border-line bg-panel/80" aria-label="Today's silver rate strip">
      <div className="ticker-run"><Run /><Run /></div>
    </div>
  );
}
