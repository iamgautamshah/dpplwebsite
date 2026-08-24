import { useEffect, useRef, useState } from 'react';

// one read of the Kathmandu clock drives both the caption and the arrival sky,
// so the visitor sees the valley as it actually looks there right now
function timeOfDay() {
  let hour = new Date().getHours();
  try {
    hour = Number(new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', hour12: false, timeZone: 'Asia/Kathmandu',
    }).format(new Date()));
  } catch { /* fall back to local time */ }

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
}

const SCENE = {
  morning: {
    line: 'the morning sun is rising over the valley.',
    sky: 'linear-gradient(180deg,#0B2444 0%,#2E5580 34%,#7E7F8C 58%,#C98F5E 78%,#EFC189 100%)',
    glow: 'radial-gradient(620px 420px at 62% 86%,rgba(255,196,120,0.75),transparent 68%)',
    disc: { x: '62%', y: '80%', size: '9rem', color: 'rgba(255,226,170,0.95)', halo: 'rgba(255,190,110,0.55)' },
    ridge: '#2A2A3A', valley: '#141726', city: 'rgba(255,196,120,0.30)', stars: 0,
    label: 'Morning · New Road, Kathmandu',
  },
  afternoon: {
    line: 'the afternoon sun stands high above the valley.',
    sky: 'linear-gradient(180deg,#0F3563 0%,#2A6497 44%,#6E9AC0 76%,#A9C6DC 100%)',
    glow: 'radial-gradient(560px 420px at 50% 18%,rgba(255,244,214,0.55),transparent 66%)',
    disc: { x: '50%', y: '20%', size: '7rem', color: 'rgba(255,250,232,0.95)', halo: 'rgba(255,236,186,0.45)' },
    ridge: '#33415A', valley: '#1A2133', city: 'rgba(220,232,246,0.18)', stars: 0,
    label: 'Midday · New Road, Kathmandu',
  },
  evening: {
    line: 'evening is settling over the valley.',
    sky: 'linear-gradient(180deg,#0C1030 0%,#2F2354 34%,#7A3A5C 60%,#C2603F 82%,#E89A57 100%)',
    glow: 'radial-gradient(640px 430px at 40% 88%,rgba(255,150,80,0.7),transparent 68%)',
    disc: { x: '40%', y: '84%', size: '10rem', color: 'rgba(255,206,150,0.92)', halo: 'rgba(255,138,72,0.5)' },
    ridge: '#241E33', valley: '#12111F', city: 'rgba(255,176,104,0.34)', stars: 60,
    label: 'Evening · New Road, Kathmandu',
  },
  night: {
    line: 'night has fallen across the valley.',
    sky: 'linear-gradient(180deg,#02040C 0%,#060F22 52%,#0B1A30 100%)',
    glow: 'radial-gradient(680px 420px at 50% 96%,rgba(216,179,106,0.34),transparent 66%)',
    disc: { x: '72%', y: '22%', size: '5rem', color: 'rgba(238,242,248,0.92)', halo: 'rgba(198,214,240,0.28)' },
    ridge: '#0D1424', valley: '#070B15', city: 'rgba(232,196,122,0.42)', stars: 220,
    label: 'Night · New Road, Kathmandu',
  },
};

// the Himalayan skyline with the valley and its lights below
function ArrivalSky({ scene }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: scene.sky }} />
      <div className="absolute inset-0" style={{ background: scene.glow }} />
      <div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 blur-[2px]"
        style={{
          left: scene.disc.x, top: scene.disc.y, width: scene.disc.size, height: scene.disc.size,
          background: scene.disc.color, boxShadow: `0 0 140px 60px ${scene.disc.halo}`,
        }}
      />
      <svg className="absolute inset-x-0 bottom-0 w-full h-[46%]" viewBox="0 0 1200 380" preserveAspectRatio="none">
        <path d="M0 214 L96 150 L168 186 L262 96 L340 158 L432 74 L534 148 L616 104 L706 170 L800 118 L900 176 L1004 132 L1104 182 L1200 146 L1200 380 L0 380 Z" fill={scene.ridge} />
        <path d="M0 268 L120 246 L240 272 L360 244 L500 274 L640 250 L780 276 L920 252 L1060 278 L1200 254 L1200 380 L0 380 Z" fill={scene.valley} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[22%]" style={{ background: `radial-gradient(70% 100% at 50% 100%, ${scene.city}, transparent 72%)` }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,13,0.55)_0%,rgba(4,6,13,0.12)_45%,rgba(4,6,13,0.62)_100%)]" />
    </div>
  );
}

function Stars({ count = 220 }) {
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
      for (let i = 0; i < count; i++) {
        g.fillStyle = `rgba(222,230,246,${0.25 + rnd() * 0.6})`;
        g.beginPath(); g.arc(rnd() * w, rnd() * h, rnd() * 1.2 + 0.3, 0, 7); g.fill();
      }
    };
    draw();
    addEventListener('resize', draw, { passive: true });
    return () => removeEventListener('resize', draw);
  }, [count]);
  return <canvas ref={ref} className="absolute inset-0" aria-hidden="true" />;
}

export default function Intro({ onEnter }) {
  const [phase, setPhase] = useState('hero'); // hero → cap1 → cap2 → arrive, then the site
  const scene = useRef(SCENE[timeOfDay()]).current;

  useEffect(() => {
    // the intro is opaque, so the pre-paint cover has done its job
    document.documentElement.classList.remove('intro-pending');
    const timers = [];
    const run = (fn, ms) => timers.push(setTimeout(fn, ms));

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('arrive');
      run(onEnter, 1800);
    } else {
      run(() => setPhase('cap1'), 3400);
      run(() => setPhase('cap2'), 6400);
      run(() => setPhase('arrive'), 9400);
      run(onEnter, 13400);
    }
    return () => timers.forEach(clearTimeout);
  }, [onEnter]);

  const on = (p) => (phase === p ? 'is-on' : '');

  return (
    <div className="fixed inset-0 z-[45] overflow-hidden bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_118%,rgba(216,179,106,0.16),transparent_60%),linear-gradient(180deg,#04060D_0%,#0A1322_70%,#0E1626_100%)]" />
      <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out bg-[radial-gradient(900px_520px_at_50%_112%,rgba(216,179,106,0.28),transparent_62%)] ${phase === 'cap2' ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

      <div className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${phase === 'arrive' ? 'opacity-100' : 'opacity-0'}`}>
        <ArrivalSky scene={scene} />
        {scene.stars > 0 && phase === 'arrive' && <Stars count={scene.stars} />}
      </div>
      <Stars count={phase === "arrive" ? 0 : 220} />

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
          Four hundred kilometres above the Himalaya, {scene.line}
          <small className="block mt-4 font-body text-[clamp(0.7rem,1.5vw,0.82rem)] tracking-[0.34em] uppercase text-gold">27.7041° N · 85.3125° E</small>
        </div>
      </section>
      <section className={`ov ${on('cap2')} absolute inset-0 z-[4] flex items-center justify-center text-center pointer-events-none`}>
        <div className="font-display text-silverhi max-w-2xl px-8 leading-snug text-[clamp(1.4rem,4vw,2.6rem)]">
          Down through the clouds — past Tundikhel, along Kantipath — to a street traders have trusted for a century.
          <small className="block mt-4 font-body text-[clamp(0.7rem,1.5vw,0.82rem)] tracking-[0.34em] uppercase text-gold">New Road · Kathmandu</small>
        </div>
      </section>

      <section className={`ov ${on('arrive')} absolute inset-0 z-[5] flex flex-col items-center justify-center text-center px-6 pointer-events-none`}>
        <img src="/images/logo.webp" alt="" width="64" height="64" className="w-16 h-16 rounded-full mb-5 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)]" />
        <p className="text-[0.62rem] tracking-[0.44em] uppercase text-gold mb-3">You have arrived</p>
        <h2 className="font-display text-silverhi leading-tight text-[clamp(2.2rem,7vw,4.2rem)] drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)]">DPPL</h2>
        <p className="mt-4 max-w-md text-silverhi/90 tracking-wide text-[clamp(0.9rem,2vw,1.05rem)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          5th Floor, Sasa Complex, New Road,<br />Kathmandu 44600, Nepal
        </p>
        <p className="mt-5 font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold/90">{scene.label}</p>
      </section>
    </div>
  );
}
