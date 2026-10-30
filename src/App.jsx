import { useEffect } from 'react';
import Site from './components/Site.jsx';
import { NotFound, Privacy, Terms } from './components/Legal.jsx';
import { ArticlesIndex, ArticlePage } from './components/Journal.jsx';
import { AboutPage, CalculatorPage, ContactPage, RatesPage } from './components/Pages.jsx';

const PAGES = { about: AboutPage, contact: ContactPage, calculator: CalculatorPage, rates: RatesPage };

const SECTIONS = ['home', 'products', 'gold', 'silver', 'rates', 'articles', 'about', 'faq', 'contact'];

// Sections are fragments on the home page (/#contact). The old path form
// (/contact) is still understood for anyone holding an old link, though the
// server now redirects those to "/".
function sectionFromPath(path) {
  const seg = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return seg !== 'articles' && !PAGES[seg] && SECTIONS.includes(seg) ? seg : null;
}
function sectionFromHash(hash) {
  const seg = String(hash || '').replace(/^#/, '').toLowerCase();
  return SECTIONS.includes(seg) ? seg : null;
}

export default function App() {
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const legal = path.startsWith('/privacy') ? 'privacy' : path.startsWith('/terms') ? 'terms' : null;
  const journal = path.replace(/^\/+|\/+$/g, '').toLowerCase().split('/');
  const isJournal = journal[0] === 'articles';
  const section = sectionFromPath(path) || (path === '/' ? sectionFromHash(typeof location !== 'undefined' ? location.hash : '') : null);

  // The site opens straight onto the page — there is no intro screen.
  // A section link (/#contact) scrolls to that section once rendered.
  useEffect(() => {
    if (legal || isJournal || !section || section === 'home') return;
    const el = document.getElementById(section);
    if (!el) return;
    // never let a scroll failure take the whole page down with it
    try { el.scrollIntoView({ block: 'start' }); }
    catch { scrollTo(0, el.offsetTop || 0); }
  }, [legal, isJournal, section]);

  const pageKey = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (PAGES[pageKey]) { const P = PAGES[pageKey]; return <P />; }
  if (legal === 'privacy') return <Privacy />;
  if (legal === 'terms') return <Terms />;
  // anything that is not a known route renders the 404 page rather than a
  // half-loaded home page
  const known = path === '/' || section || isJournal || legal;
  if (!known) return <NotFound />;
  if (isJournal) return journal[1] ? <ArticlePage slug={journal[1]} /> : <ArticlesIndex />;
  return <Site />;
}
