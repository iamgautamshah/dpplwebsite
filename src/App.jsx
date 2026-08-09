import { useCallback, useEffect, useRef, useState } from 'react';
import { lazy, Suspense } from 'react';
const Intro = lazy(() => import('./components/Intro.jsx'));
import Site from './components/Site.jsx';
import { Privacy, Terms } from './components/Legal.jsx';

const isBot = /bot|crawl|spider|slurp|bingpreview|adsbot|mediapartners|lighthouse/i;

export default function App() {
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  if (path.startsWith('/privacy')) return <Privacy />;
  if (path.startsWith('/terms')) return <Terms />;

  const [entered, setEntered] = useState(
    () => isBot.test(navigator.userAgent) || (location.hash && location.hash !== '#top')
  );
  const [flash, setFlash] = useState(false);

  const entering = useRef(false);
  const enter = useCallback(() => {
    if (entering.current) return;          // the auto timer and the card button share this
    entering.current = true;
    setFlash(true);
    setTimeout(() => {
      setEntered(true);
      // clean address bar — no hash — and no history entry, so Back leaves the
      // site rather than replaying the intro
      history.replaceState(null, '', '/');
      scrollTo(0, 0);
      setTimeout(() => setFlash(false), 80);
    }, 650);
  }, []);

  useEffect(() => {
    if (entered) scrollTo(0, 0);
  }, [entered]);

  return (
    <>
      {!entered && <Suspense fallback={<div className="fixed inset-0 bg-void" />}><Intro onEnter={enter} /></Suspense>}
      {entered && <Site />}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[50] bg-silverhi pointer-events-none transition-opacity duration-700"
        style={{ opacity: flash ? 1 : 0 }}
      />
    </>
  );
}
