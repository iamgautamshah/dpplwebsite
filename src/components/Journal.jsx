import { ARTICLES, bySlug } from '../content/articles.js';
import { Page } from './Pages.jsx';

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    if (b.h) return <h2 key={i} className="font-display font-semibold text-text text-[clamp(1.3rem,3vw,1.7rem)] mt-10 mb-3">{b.h}</h2>;
    if (b.ul)
      return (
        <ul key={i} className="my-4 space-y-2.5 pl-1">
          {b.ul.map((li, j) => (
            <li key={j} className="flex gap-3 text-[1rem] leading-relaxed text-body/85">
              <span className="hallmark mt-2 shrink-0" aria-hidden="true" />
              <span dangerouslySetInnerHTML={{ __html: li }} />
            </li>
          ))}
        </ul>
      );
    if (b.note)
      return (
        <p key={i} className="my-6 rounded-xl border border-signal/30 bg-signal/[0.07] px-5 py-4 text-[0.95rem] leading-relaxed text-body/85">
          {b.note}
        </p>
      );
    return <p key={i} className="prose-justify my-4 text-[1.02rem] leading-[1.75] text-body/85" dangerouslySetInnerHTML={{ __html: b.p }} />;
  });
}

export function ArticlesIndex() {
  return (
    <Page
      current="articles"
      title="The Diamond Palace Journal"
      intro="Practical writing from a working bullion counter on New Road: how gold and silver are priced in Nepal, how to check a bar before you pay for it, how to store it, and why both metals have held their value for thousands of years."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {ARTICLES.map((a) => (
          <article key={a.slug} className="flex flex-col rounded-2xl border border-line bg-panel p-6 transition-colors duration-300 hover:border-signal/50">
            <p className="text-[0.62rem] tracking-[0.3em] uppercase text-signal mb-3">{a.category}</p>
            <h2 className="font-display font-semibold text-text text-xl leading-snug">
              <a href={`/articles/${a.slug}`} className="transition-colors hover:text-signal">{a.title}</a>
            </h2>
            <p className="mt-3 text-sm text-body/85 leading-relaxed flex-1">{a.teaser}</p>
            <p className="mt-4 text-[0.8rem] text-mute">{fmtDate(a.date)}, {a.minutes} min read</p>
            <a href={`/articles/${a.slug}`} className="mt-4 self-start text-sm text-signal border-b border-signal/50 pb-0.5 transition-colors hover:border-signal">
              Read the article
            </a>
          </article>
        ))}
      </div>
    </Page>
  );
}

export function ArticlePage({ slug }) {
  const a = bySlug(slug);
  if (!a) return <ArticlesIndex />;
  const others = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <Page
      current="articles"
      narrow
      title={a.title}
      before={(
        <nav aria-label="Breadcrumb" className="mb-5 text-[0.8rem] text-silver/60">
          <a href="/" className="transition-colors hover:text-gold">Home</a>
          <span className="mx-2" aria-hidden="true">/</span>
          <a href="/articles" className="transition-colors hover:text-gold">Journal</a>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-silver/80">{a.category}</span>
        </nav>
      )}
      meta={<p className="mt-5 text-[0.85rem] text-silver/60">By Diamond Palace Pvt. Ltd. on {fmtDate(a.date)}, {a.minutes} min read</p>}
    >
      <article>
        <Blocks blocks={a.blocks} />
      </article>

      <div className="mt-12 pt-8 border-t border-line">
        <h2 className="font-display text-silverhi text-lg mb-5">Continue reading</h2>
        <ul className="space-y-4">
          {others.map((o) => (
            <li key={o.slug}>
              <a href={`/articles/${o.slug}`} className="group block">
                <span className="font-display font-semibold text-text text-lg transition-colors group-hover:text-signal">{o.title}</span>
                <span className="block mt-1 text-sm text-mute leading-relaxed">{o.teaser.slice(0, 110)}…</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/articles" className="btn-line">All articles</a>
          <a href="/rates" className="btn-gold">Today’s gold and silver price</a>
        </div>
      </div>
    </Page>
  );
}
