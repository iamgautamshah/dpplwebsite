import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Site from './components/Site.jsx';
import { Privacy, Terms } from './components/Legal.jsx';

const Intro = lazy(() => import('./components/Intro.jsx'));

const isBot = /bot|crawl|spider|slurp|bingpreview|adsbot|mediapartners|lighthouse/i;
const SECTIONS = ['home', 'products', 'articles', 'about', 'contact'];

// /contact, /contact/ and /Contact all resolve to the contact section
function sectionFromPath(path) {
  const seg = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return SECTIONS.includes(seg) ? seg : null;
}

export default function App() {
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const legal = path.startsWith('/privacy') ? 'privacy' : path.startsWith('/terms') ? 'terms' : null;
  const section = sectionFromPath(path);

  // arriving on a section URL means the visitor already knows where they are
  // going, so the intro is skipped
  const [entered, setEntered] = useState(
    () => Boolean(legal) || Boolean(section) || isBot.test(navigator.userAgent) || (location.hash && location.hash !== '#top')
  );
  const entering = useRef(false);

  const enter = useCallback(() => {
    if (entering.current) return;
    entering.current = true;
    // straight in — no fade-through-white, no waiting. the address stays at the
    // root; /home only appears if the visitor clicks the logo or HOME
    setEntered(true);
    scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!entered || legal) return;
    if (section && section !== 'home') {
      const el = document.getElementById(section);
      // never let a scroll failure take the whole page down with it
      if (el) {
        try { el.scrollIntoView({ block: 'start' }); return; }
        catch { scrollTo(0, el.offsetTop || 0); return; }
      }
    }
    scrollTo(0, 0);
  }, [entered, legal, section]);

  if (legal === 'privacy') return <Privacy />;
  if (legal === 'terms') return <Terms />;

  return (
    <>
      {!entered && <Suspense fallback={<div className="fixed inset-0 bg-void" />}><Intro onEnter={enter} /></Suspense>}
      {entered && <Site />}
    </>
  );
}
