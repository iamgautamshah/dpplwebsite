import { Component, useCallback, useEffect, useRef, useState } from 'react';
import Site from './components/Site.jsx';
import { NotFound, Privacy, Terms } from './components/Legal.jsx';
import { ArticlesIndex, ArticlePage } from './components/Journal.jsx';

import Intro from './components/Intro.jsx';

const isBot = /bot|crawl|spider|slurp|bingpreview|adsbot|mediapartners|lighthouse/i;
const SECTIONS = ['home', 'products', 'about', 'contact'];

const seenIntro = () => {
  try { return Boolean(sessionStorage.getItem('dppl-intro')); } catch { return false; }
};

// /contact, /contact/ and /Contact all resolve to the contact section
function sectionFromPath(path) {
  const seg = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return SECTIONS.includes(seg) ? seg : null;
}


// The intro is decorative. If it fails for any reason the site must still be
// usable, so this boundary swallows the error and enters immediately.
class IntroBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function App() {
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const legal = path.startsWith('/privacy') ? 'privacy' : path.startsWith('/terms') ? 'terms' : null;
  const journal = path.replace(/^\/+|\/+$/g, '').toLowerCase().split('/');
  const isJournal = journal[0] === 'articles';
  const section = sectionFromPath(path);

  // arriving on a section URL means the visitor already knows where they are
  // going, so the intro is skipped
  const [entered, setEntered] = useState(
    () => Boolean(legal) || isJournal || Boolean(section) || seenIntro() || isBot.test(navigator.userAgent) || (location.hash && location.hash !== '#top')
  );
  const entering = useRef(false);

  const enter = useCallback(() => {
    if (entering.current) return;
    entering.current = true;
    // straight in — no fade-through-white, no waiting. the address stays at the
    // root; /home only appears if the visitor clicks the logo or HOME
    setEntered(true);
    document.documentElement.classList.remove('intro-pending');
    document.body.style.overflow = '';
    try { sessionStorage.setItem('dppl-intro', '1'); } catch { /* private mode */ }
    scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (entered) {
      // the intro is not going to run (deep link, repeat visit, crawler), so the
      // pre-paint cover must come off or the visitor is left staring at it
      document.documentElement.classList.remove('intro-pending');
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [entered]);

  useEffect(() => {
    if (!entered || legal || isJournal) return;
    if (section && section !== 'home') {
      const el = document.getElementById(section);
      // never let a scroll failure take the whole page down with it
      if (el) {
        try { el.scrollIntoView({ block: 'start' }); return; }
        catch { scrollTo(0, el.offsetTop || 0); return; }
      }
    }
    scrollTo(0, 0);
  }, [entered, legal, isJournal, section]);

  if (legal === 'privacy') return <Privacy />;
  if (legal === 'terms') return <Terms />;
  // anything that is not a known route renders the 404 page rather than a
  // half-loaded home page
  const known = path === '/' || section || isJournal || legal;
  if (!known) return <NotFound />;
  if (isJournal) return journal[1] ? <ArticlePage slug={journal[1]} /> : <ArticlesIndex />;

  const page = <Site />;

  return (
    <>
      {/* While the intro plays the site is not rendered at all. Overlaying it
          meant a collapsing mobile toolbar could reveal buttons underneath;
          the prerendered HTML has already painted, and the rate is fetched by
          the head script regardless, so nothing is lost by waiting. */}
      {entered && page}
      {!entered && (
        <IntroBoundary onFail={enter}>
          <Intro onEnter={enter} />
        </IntroBoundary>
      )}
    </>
  );
}
