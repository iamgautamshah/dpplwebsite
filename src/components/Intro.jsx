import { useEffect, useRef, useState } from 'react';

// the first caption follows the clock in Kathmandu, not the visitor's timezone
function openingLine() {
  let hour = new Date().getHours();
  try {
    hour = Number(new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', hour12: false, timeZone: 'Asia/Kathmandu',
    }).format(new Date()));
  } catch { /* fall back to local time */ }

  if (hour >= 5 && hour < 11) return 'the morning sun is rising over the valley.';
  if (hour >= 11 && hour < 16) return 'the afternoon sun stands high above the valley.';
  if (hour >= 16 && hour < 19) return 'evening is settling over the valley.';
  return 'night has fallen across the valley.';
}

function Stars() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const draw = () => {
      const w = innerWidth, h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      let s = 42;
      const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let i = 0; i < 220; i++) {
        g.fillStyle = `rgba(222,230,246,${0.25 + rnd() * 0.6})`;
        g.beginPath(); g.arc(rnd() * w, rnd() * h, rnd() * 1.2 + 0.3, 0, 7); g.fill();
      }
    };
    draw();
    addEventListener('resize', draw, { passive: true });
    return () => removeEventListener('resize', draw);
  }, []);
  return <canvas ref={ref} className="absolute inset-0" aria-hidden="true" />;
}

export default function Intro({ onEnter }) {
  const [phase, setPhase] = useState('hero'); // hero → cap1 → cap2, then the site
  const line = useRef(openingLine());

  useEffect(() => {
    const timers = [];
    const run = (fn, ms) => timers.push(setTimeout(fn, ms));

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      run(onEnter, 600);
    } else {
      run(() => setPhase('cap1'), 3400);
      run(() => setPhase('cap2'), 6400);
      run(onEnter, 9400);
    }
    return () => timers.forEach(clearTimeout);
  }, [onEnter]);

  const on = (p) => (phase === p ? 'is-on' : '');

  return (
    <div className="fixed inset-0 z-[1] overflow-hidden bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_118%,rgba(216,179,106,0.16),transparent_60%),linear-gradient(180deg,#04060D_0%,#0A1322_70%,#0E1626_100%)]" />
      <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out bg-[radial-gradient(900px_520px_at_50%_112%,rgba(216,179,106,0.28),transparent_62%)] ${phase === 'cap2' ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      <Stars />

      <section className={`ov ${on('hero')} stag absolute inset-0 z-[4] flex flex-col items-center justify-center text-center pointer-events-none`}>
        <p className="eyebrow mb-6">DPPL · <b className="text-gold font-medium">Est. 2080 B.S.</b> · New Road, Kathmandu</p>
        <h1 className="font-display text-silverhi leading-[1.04] text-[clamp(2.6rem,8.5vw,6.4rem)]">
          Hello, <span className="text-gold">Investors.</span>
        </h1>
        <p className="mt-5 max-w-xl px-6 text-silver/75 tracking-wide text-[clamp(0.95rem,2vw,1.15rem)]">
          Somewhere on the planet below — in the oldest bazaar of Kathmandu — fine silver is being weighed, sealed, and priced for today. Let us take you there.
        </p>
      </section>

            <section className={`ov ${on('cap1')} absolute inset-0 z-[4] flex items-center justify-center text-center pointer-events-none`}>
        <div className="font-display text-silverhi max-w-2xl px-8 leading-snug text-[clamp(1.4rem,4vw,2.6rem)]">
          Four hundred kilometres above the Himalaya, {line.current}
          <small className="block mt-4 font-body text-[clamp(0.7rem,1.5vw,0.82rem)] tracking-[0.34em] uppercase text-gold">27.7041° N · 85.3125° E</small>
        </div>
      </section>
      <section className={`ov ${on('cap2')} absolute inset-0 z-[4] flex items-center justify-center text-center pointer-events-none`}>
        <div className="font-display text-silverhi max-w-2xl px-8 leading-snug text-[clamp(1.4rem,4vw,2.6rem)]">
          Down through the clouds — past Tundikhel, along Kantipath — to a street traders have trusted for a century.
          <small className="block mt-4 font-body text-[clamp(0.7rem,1.5vw,0.82rem)] tracking-[0.34em] uppercase text-gold">New Road · Kathmandu</small>
        </div>
      </section>

    </div>
  );
}
