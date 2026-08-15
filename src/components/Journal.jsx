import { ARTICLES, bySlug } from '../content/articles.js';

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function Chrome({ children }) {
  return (
    <main className="relative z-10 bg-[#0B0F16] min-h-screen">
      <nav className="sticky top-0 z-40 bg-[#0A0E16]/95 backdrop-blur-xl border-b border-silver/10">
        <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3 max-w-5xl mx-auto">
          <a href="/home" className="flex items-center gap-3">
            <img src="/images/logo.webp" alt="DPPL seal logo" className="w-11 h-11 rounded-full" width="44" height="44" />
            <span className="font-display text-xl tracking-[0.14em] text-silverhi leading-none">
              DP<span className="text-gold">PL</span>
              <small className="block font-body text-[0.5rem] tracking-[0.3em] text-steel mt-1">NEW ROAD · KATHMANDU</small>
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="/articles" className="hidden sm:block text-[0.7rem] tracking-[0.22em] uppercase text-steel transition-colors hover:text-gold">Journal</a>
            <a href="/home" className="text-[0.7rem] tracking-[0.22em] uppercase text-steel transition-colors hover:text-gold">← Back to site</a>
          </div>
        </div>
      </nav>
      {children}
      <footer className="border-t border-silver/10 px-4 sm:px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-steel tracking-wide">
          <p>DPPL · 5th Floor, Sasa Complex, New Road, Kathmandu · © 2026</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/articles" className="transition-colors hover:text-gold">Journal</a>
            <a href="/privacy/" className="transition-colors hover:text-gold">Privacy Policy</a>
            <a href="/terms/" className="transition-colors hover:text-gold">Terms of Use</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    if (b.h) return <h2 key={i} className="font-display text-silverhi text-[clamp(1.3rem,3vw,1.7rem)] mt-10 mb-3">{b.h}</h2>;
    if (b.ul)
      return (
        <ul key={i} className="my-4 space-y-2.5 pl-1">
          {b.ul.map((li, j) => (
            <li key={j} className="flex gap-3 text-[1rem] leading-relaxed text-silver/80">
              <span className="hallmark mt-2 shrink-0" aria-hidden="true" />
              <span dangerouslySetInnerHTML={{ __html: li }} />
            </li>
          ))}
        </ul>
      );
    if (b.note)
      return (
        <p key={i} className="my-6 rounded-xl border border-gold/25 bg-gold/[0.06] px-5 py-4 text-[0.95rem] leading-relaxed text-silver/85">
          {b.note}
        </p>
      );
    return <p key={i} className="my-4 text-[1.02rem] leading-[1.75] text-silver/80" dangerouslySetInnerHTML={{ __html: b.p }} />;
  });
}

export function ArticlesIndex() {
  return (
    <Chrome>
      <div className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <div className="frame max-w-5xl mx-auto p-5 sm:p-8 md:p-12">
          <p className="flex items-center gap-3.5 mb-4 text-[0.64rem] tracking-[0.42em] uppercase text-steel">
            <span className="hallmark" aria-hidden="true" />
            <span>The DPPL Journal</span>
            <span className="flex-1 h-px bg-silver/15" aria-hidden="true" />
          </p>
          <h1 className="engraved font-display text-silverhi text-[clamp(2rem,5vw,3.2rem)]">Understand silver before you buy it.</h1>
          <p className="mt-4 max-w-2xl text-silver/75 leading-relaxed">
            Practical writing from a working bullion counter on New Road — how silver is priced in Nepal, how to check a bar
            before you pay for it, how to store it, and why the metal has held value for five thousand years.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {ARTICLES.map((a) => (
              <article key={a.slug} className="flex flex-col rounded-2xl border border-silver/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-gold/35 hover:bg-white/[0.04]">
                <p className="text-[0.6rem] tracking-[0.34em] uppercase text-gold mb-3">{a.category}</p>
                <h2 className="font-display text-silverhi text-xl leading-snug">
                  <a href={`/articles/${a.slug}`} className="transition-colors hover:text-gold">{a.title}</a>
                </h2>
                <p className="mt-3 text-sm text-silver/70 leading-relaxed flex-1">{a.teaser}</p>
                <p className="mt-4 flex items-center gap-3 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-steel">
                  <span>{fmtDate(a.date)}</span><span aria-hidden="true">·</span><span>{a.minutes} min read</span>
                </p>
                <a href={`/articles/${a.slug}`} className="mt-4 self-start text-[0.72rem] tracking-[0.22em] uppercase text-gold border-b border-gold/40 pb-1 transition-colors hover:border-gold">
                  Read the article →
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  );
}

export function ArticlePage({ slug }) {
  const a = bySlug(slug);
  if (!a) return <ArticlesIndex />;
  const others = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <Chrome>
      <div className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <article className="frame max-w-3xl mx-auto p-5 sm:p-8 md:p-12">
          <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-steel">
            <a href="/home" className="transition-colors hover:text-gold">DPPL</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <a href="/articles" className="transition-colors hover:text-gold">Journal</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-silver/70">{a.category}</span>
          </nav>

          <h1 className="engraved font-display text-silverhi text-[clamp(1.9rem,4.8vw,2.9rem)] leading-tight">{a.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-steel">
            <span className="text-gold">{a.category}</span><span aria-hidden="true">·</span>
            <span>{fmtDate(a.date)}</span><span aria-hidden="true">·</span>
            <span>{a.minutes} min read</span><span aria-hidden="true">·</span>
            <span>DPPL</span>
          </p>

          <div className="mt-8 border-t border-silver/10 pt-6">
            <Blocks blocks={a.blocks} />
          </div>

          <div className="mt-12 pt-8 border-t border-silver/10">
            <p className="text-[0.64rem] tracking-[0.34em] uppercase text-steel mb-5">Continue reading</p>
            <ul className="space-y-4">
              {others.map((o) => (
                <li key={o.slug}>
                  <a href={`/articles/${o.slug}`} className="group block">
                    <span className="font-display text-silverhi text-lg transition-colors group-hover:text-gold">{o.title}</span>
                    <span className="block mt-1 text-sm text-silver/60 leading-relaxed">{o.teaser.slice(0, 110)}…</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/articles" className="btn-line">← All articles</a>
              <a href="/home" className="btn-gold">Today's silver price</a>
            </div>
          </div>
        </article>
      </div>
    </Chrome>
  );
}
