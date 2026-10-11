
const KAGOSIDA = 'https://kagosida.org.np';
const FENEGOSIDA_SOURCES = ['https://www.fenegosida.org/', 'https://fenegosida.org/'];
const KV_KEY = 'silver';
const MANUAL_KEY = 'manual-rate';
const KV_ENDPOINT_KEY = 'silver-endpoint';
const PUBLISH_MINUTES = 10 * 60 + 55; // 10:55 NPT
const RETRY_WINDOW_END = 15 * 60;     // keep retrying until 3:00 PM NPT
const RETRY_GAP_MS = 15 * 60 * 1000;
const TOLA_PER_10G = 1.16638;         // (11.6638 g/tola) ÷ 10 g

let memCache = null;
let lastFailAt = 0;
// short enough that the site recovers within a minute of a source coming
// back, long enough that a sustained outage is not hammered on every request
const FAIL_RETRY_MS = 25 * 1000;
let memEndpoint = {};

const UA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ne;q=0.8',
};

// Cloudflare caps subrequests per invocation; discovery used to blow through
// it and starve the later sources. Every outbound call is now counted.
let budget = 0;
let floor = 0;      // no single source may spend past this
const spend = () => {
  if (budget <= 0 || budget <= floor) throw new Error('subrequest budget spent');
  budget -= 1;
};

async function getText(url, referer, method = 'GET') {
  spend();
  const headers = referer
    ? { ...UA_HEADERS, Referer: referer + '/', Origin: referer }
    : UA_HEADERS;
  const init = { method, headers, redirect: 'follow', signal: AbortSignal.timeout(12000) };
  if (method === 'POST') {
    init.headers = { ...headers, 'Content-Type': 'application/json' };
    init.body = '{}';
  }
  let res = await fetch(url, init);

  // some servers reject a cross-site Origin outright; others require it. If the
  // first shape is refused, try once more without those headers.
  if ((res.status === 401 || res.status === 403) && referer) {
    spend();
    res = await fetch(url, { ...init, headers: UA_HEADERS });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* =================== silver sale/purchase extraction =================== */
const NUM_RE = '(\\d+(?:,\\d{3})*(?:\\.\\d+)?)';  // commas only as thousands separators
const num = (s) => parseFloat(String(s).replace(/,/g, ''));
const r2 = (x) => Math.round(x * 100) / 100;

/** Normalize Devanagari + escaped-unicode keywords into English markers. */
/* FENEGOSIDA serves a server-rendered PHP table, so the label and its figure
   are separated by markup: <td>चाँदी</td><td>Rs 4,975</td>. Tags have to go
   before any label/value pattern can match. JSON bodies pass through
   untouched. */
function stripMarkup(t) {
  if (!/<[a-z!/][^>]*>/i.test(t)) return t;
  return t
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]{0,400}>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/[ \t]+/g, ' ');
}

// Nepali numerals appear on Nepali-language pages; the figure is the same
const NP_DIGITS = { '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4', '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9' };

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

/* A Bikram Sambat year (2083) sits right inside the plausible tola range, so
   dates have to be removed before any figure is read off the page. */
function stripDates(t) {
  return t
    .replace(/\b(?:19|20)\d{2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{1,2}\b/g, ' ')   // 2026-08-29, 2083-05-11
    .replace(/\b\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*(?:19|20)\d{2}\b/g, ' ')   // 29-08-2026
    .replace(new RegExp(`\\b\\d{1,2}\\s+(?:${MONTHS})[a-z]*,?\\s*(?:19|20|2[01])\\d{2}\\b`, 'gi'), ' ')
    .replace(new RegExp(`\\b(?:${MONTHS})[a-z]*\\s+\\d{1,2},?\\s*(?:19|20)\\d{2}\\b`, 'gi'), ' ')
    .replace(/\b(?:20[5-9]\d|21\d\d)\s*[-/]\s*\d{1,2}\b/g, ' ');                // 2083-05
}

function normalize(raw) {
  return stripDates(stripMarkup(raw)
    .replace(/[\u0966-\u096F]/g, (d) => NP_DIGITS[d]))
    .replace(/\\u091a\\u093e(?:\\u0901)?\\u0926\\u0940/g, 'silver')  // चाँदी escaped
    .replace(/चा[ँ]?दी/g, 'silver')
    .replace(/\\u092c\\u093f\\u0915\\u094d\\u0930\\u0940/g, 'sale')  // बिक्री escaped
    .replace(/बिक्री|बिक्रि/g, 'sale')
    .replace(/\\u0916\\u0930\\u093f\\u0926/g, 'purchase')            // खरिद escaped
    .replace(/खरिद/g, 'purchase')
    .replace(/&nbsp;|&#160;|\u00A0/g, ' ')
    .replace(/\b10\s*(?:gram|grams|gm|g)\b/gi, 'tengram');
}

const YEAR_LIKE = (v) => Number.isInteger(v) && ((v >= 1990 && v <= 2100) || (v >= 2050 && v <= 2110));

function plausible(unit, v) {
  // 2026 (AD) and 2083 (BS) both land inside the tola range; neither is a price
  if ((unit === 'tola' || unit === 'g10') && YEAR_LIKE(v)) return false;
  if (unit === 'tola') return v >= 800 && v <= 50000;
  if (unit === 'g10') return v >= 600 && v <= 45000;
  if (unit === 'gram') return v >= 60 && v <= 4500;
  if (unit === 'kg') return v >= 60000 && v <= 4500000;
  return false;
}

function fromUnits(u) {
  if (!u) return null;
  if (u.tola && u.g10) return { tola: u.tola, g10: u.g10, g10Given: true };
  if (u.tola) return { tola: u.tola, g10: r2(u.tola / TOLA_PER_10G) };
  if (u.g10) return { tola: r2(u.g10 * TOLA_PER_10G), g10: u.g10 };
  if (u.gram) return { tola: r2(u.gram * 11.6638), g10: r2(u.gram * 10) };
  if (u.kg) return { tola: r2(u.kg * 0.0116638), g10: r2(u.kg / 100) };
  return null;
}

function classifyKey(k) {
  const kind = /sal|sell|bikri/.test(k) ? 'sale'
    : /purch|buy|kharid/.test(k) ? 'purchase' : 'na';
  const unit = /tola/.test(k) ? 'tola'
    : /(?:10|ten)[ _-]?(?:g|gm|gram)|gram[ _-]?10/.test(k) ? 'g10'
    : /kg|kilo/.test(k) ? 'kg'
    : /gram|gm/.test(k) ? 'gram'
    : null;
  return { kind, unit };
}

/**
 * Extracts { sale:{tola,g10}, purchase:{tola,g10}|null } from any text/JSON.
 * pass 1 — labeled key:value pairs near a silver mention (sale/purchase ×
 *          tola/10g/gram/kg, in English, romanized Nepali, or Devanagari)
 * pass 2 — unlabeled numbers: unit pairs by ratio ≈1.166, then a close pair
 *          (ratio 1.001–1.12) read as sale > purchase
 * pass 3 — single value → treated as the sale price.
 */
/* Rate pages list gold first, and headings like "Gold Silver Rates" mean the
   word silver can appear a long way from the silver figures. Cut the page into
   runs that each belong to one metal and keep only silver's, so a gold number
   can never be read as a silver price. */
function silverOnly(text) {
  const marks = [...text.matchAll(/\b(gold|silver|platinum|chandi|sun)\b/gi)];
  if (marks.length < 2) return text;
  const parts = [];
  marks.forEach((m, i) => {
    if (!/^silver$/i.test(m[1])) return;
    const from = m.index;
    const to = i + 1 < marks.length ? marks[i + 1].index : text.length;
    parts.push(text.slice(from, to));
  });
  const joined = parts.join(' \n ');
  return joined.trim().length > 8 ? joined : text;
}

/* KAGOSIDA publishes structured JSON:
     silverRates: [{ sellingPerTola, sellingPer10g, buyingPerTola, buyingPer10g }]
   Their buyingPerTola is currently 5,474 — above the selling price, and a
   transposition of 4,574 — so each figure is checked against its counterpart
   before use, and the ten-gram value wins when they disagree. */
function fromKagosidaJson(raw) {
  let d;
  try { d = JSON.parse(raw); } catch { return null; }
  const row = Array.isArray(d?.silverRates) ? d.silverRates[0] : null;
  if (!row) return null;
  const n = (v) => (Number.isFinite(v) && v > 0 ? v : null);
  const consistent = (tola, g10) => tola && g10 && Math.abs(tola / g10 - TOLA_PER_10G) / TOLA_PER_10G < 0.015;

  const pick = (tola, g10) => {
    if (consistent(tola, g10)) return { tola: r2(tola), g10: r2(g10), g10Given: true };
    if (g10) return { tola: toHalf(g10 * TOLA_PER_10G), g10: r2(g10), g10Given: true };
    if (tola) return { tola: r2(tola), g10: r2(tola / TOLA_PER_10G) };
    return null;
  };

  const sale = pick(n(row.sellingPerTola), n(row.sellingPer10g));
  if (!sale) return null;
  let purchase = pick(n(row.buyingPerTola), n(row.buyingPer10g));
  if (purchase && purchase.tola >= sale.tola) purchase = null;   // never quote a buy above the sell

  /* The same response carries the gold board. Only 24 carat is published on
     the site; the 22-carat row is deliberately ignored so the two can never be
     confused. Gold is optional — a bad gold row must not cost us the silver. */
  let gold = null;
  const goldRow = Array.isArray(d?.goldRates)
    ? d.goldRates.find((g) => /24/.test(String(g?.caretType ?? '')))
    : null;
  if (goldRow) {
    const gSale = pick(n(goldRow.sellingPerTola), n(goldRow.sellingPer10g));
    let gBuy = pick(n(goldRow.buyingPerTola), n(goldRow.buyingPer10g));
    if (gBuy && gSale && gBuy.tola >= gSale.tola) gBuy = null;
    if (gSale && gSale.tola >= GOLD_TOLA_MIN && gSale.tola <= GOLD_TOLA_MAX) {
      gold = { sale: gSale, purchase: gBuy };
    }
  }

  // structured figures from the association itself need no second opinion
  return { sale, purchase, gold, trusted: true };
}

function extractQuote(raw) {
  const kago = fromKagosidaJson(raw);
  if (kago) return kago;

  const text = silverOnly(normalize(raw));
  const low = text.toLowerCase();

  const idxs = [];
  for (const key of ['silver', 'chandi', 'chadi']) {
    let i = -1;
    while ((i = low.indexOf(key, i + 1)) > -1 && idxs.length < 20) idxs.push(i);
  }
  if (!idxs.length) return null;

  for (const i of idxs) {
    const region = text.slice(Math.max(0, i - 80), i + 1400);

    /* pass 1: labeled entries */
    const entries = [];
    for (const m of region.matchAll(new RegExp('"([^"\\n]{1,80})"\\s*:\\s*"?' + NUM_RE + '"?', 'g'))) {
      entries.push([m[1].toLowerCase(), num(m[2])]);
    }
    for (const m of region.matchAll(new RegExp('([A-Za-z][A-Za-z0-9 _()/-]{2,50}?)\\s*[:=\\-]?\\s*(?:Rs\\.?|रु|npr)?\\s*' + NUM_RE, 'gi'))) {
      entries.push([m[1].toLowerCase(), num(m[2])]);
    }
    const acc = { sale: {}, purchase: {}, na: {} };
    for (const [k, v] of entries) {
      const { kind, unit } = classifyKey(k);
      const u = unit || 'tola';
      if (plausible(u, v) && acc[kind][u] === undefined) acc[kind][u] = v;
    }
    const plain = Object.keys(acc.sale).length ? acc.sale
      : Object.keys(acc.na).length ? acc.na : null;
    let sale = fromUnits(plain);
    let purchase = fromUnits(Object.keys(acc.purchase).length ? acc.purchase : null);
    if (sale && purchase) {
      if (purchase.tola > sale.tola) [sale, purchase] = [purchase, sale]; // labels swapped? sale is the higher
      if (sale.tola / purchase.tola < 1.3) return { sale, purchase };
    }
    if (sale && !purchase) {
      // maybe purchase sits unlabeled nearby: a number 0–12% under sale
      const p = collectNums(region).find((v) => v < sale.tola && sale.tola / v > 1.001 && sale.tola / v < 1.12);
      return { sale, purchase: p ? fromUnits({ tola: p }) : null };
    }
    if (purchase && !sale) {
      const s = collectNums(region).find((v) => v > purchase.tola && v / purchase.tola > 1.001 && v / purchase.tola < 1.12);
      if (s) return { sale: fromUnits({ tola: s }), purchase };
      return { sale: null, purchase };
    }

    /* pass 2: unlabeled numbers */
    const nums = collectNums(region);
    // detect the unit pair(s) first (tola vs 10g)
    const unitPairs = [];
    for (const a of nums) for (const b of nums) {
      if (a > b && a / b > 1.14 && a / b < 1.19) unitPairs.push([a, b]);
    }
    if (unitPairs.length >= 2) {
      // two unit-pairs → the higher pair is sale, lower is purchase
      unitPairs.sort((x, y) => y[0] - x[0]);
      const [sT, sG] = unitPairs[0], [pT, pG] = unitPairs[unitPairs.length - 1];
      if (sT !== pT && sT / pT < 1.12) {
        return { sale: { tola: sT, g10: sG }, purchase: { tola: pT, g10: pG } };
      }
    }
    if (unitPairs.length === 1) {
      const [t, g] = unitPairs[0];
      return { sale: { tola: t, g10: g }, purchase: null };
    }
    // close pair in the same unit → sale (higher) / purchase (lower)
    const tolaLike = nums.filter((v) => v >= 1500 && v <= 30000);
    for (const a of tolaLike) for (const b of tolaLike) {
      if (a > b && a / b > 1.001 && a / b < 1.12) {
        return { sale: fromUnits({ tola: a }), purchase: fromUnits({ tola: b }) };
      }
    }
  }

  /* pass 3: single value anywhere near silver → sale only */
  const all = idxs.flatMap((i) => collectNums(text.slice(i, i + 900)));
  const single = all.find((v) => v >= 1500 && v <= 30000)
    ?? all.find((v) => v >= 100 && v < 1500)
    ?? all.find((v) => v >= 60000);
  if (single === undefined) return null;
  const u = single >= 60000 ? { kg: single } : single < 1500 ? { gram: single } : { tola: single };
  return { sale: fromUnits(u), purchase: null };
}

function isYear(v) { return Number.isInteger(v) && v >= 1900 && v <= 2110; }

function collectNums(region) {
  const out = [];
  for (const m of region.matchAll(new RegExp(NUM_RE, 'g'))) {
    const v = num(m[1]);
    if (v >= 60 && v <= 4500000 && !out.includes(v)) out.push(v);
  }
  return (out).filter((v) => !isYear(v));
}

/* ============================ sources ============================= */
/* Both federations publish the same daily Kathmandu reference, and both are
   single-page apps whose figures come from an API the page loads. So each
   source gets the same treatment: read the page, find the API its bundle
   talks to, remember the endpoint that worked, and fall back to parsing the
   HTML directly in case it is ever server-rendered. */

const STATIC_HOST_RE = /(googleapis|gstatic|w3\.org|reactjs\.org|react\.dev|facebook|fbcdn|twitter|x\.com|youtube|youtu\.be|instagram|linkedin|jsdelivr|unpkg|cdnjs|cloudflareinsights|schema\.org|sentry|googletagmanager|google-analytics|maps\.google|goo\.gl|fonts\.|gravatar|wikipedia|github\.io|npmjs)/i;
const ASSET_RE = /\.(png|jpe?g|svg|gif|webp|css|map|woff2?|ttf|eot|ico|mp4|pdf)(\?|#|$)/i;
const SPA_ECHO_RE = /^\s*<!doctype html|^\s*<html/i;

/* FENEGOSIDA sets Nepal's official rate. Its own site is a React app whose
   API answers 401 without a key, so the figure is read from pages that
   republish it. The widget page is first: it carries the rate and almost
   nothing else, which is what makes it safe to parse. */
/* FENEGOSIDA sets Nepal's official rate, so its own site is asked first: the
   published pages, then the API its front end talks to. That API answers 401
   to anonymous requests, so the request is made the way a browser on their own
   site would make it. If none of that yields a figure, sites that republish
   the same federation rate are used, and `via` records which. */
/* Two sources only, in this order:
     1. KAGOSIDA — the Kathmandu association this counter trades against. It
        publishes both a sale and a purchase rate; both are used as given.
     2. FENEGOSIDA — the national federation, which publishes a single official
        rate, so the buy-back is calculated from it. */
const SOURCES = [
  {
    name: 'KAGOSIDA', via: 'kagosida.org.np',
    kvKey: 'silver-endpoint-kagosida',
    origins: ['https://kagosida.org.np'],
    /* Their front end calls the API with relative paths, so the backend host
       never appears in the bundle. These are the hosts their app is known to
       run on; they are tried before any guessed subdomain. */
    /* Their front end calls this host; it is not discoverable from the bundle
       because the calls are relative, so it is named here. */
    extraBases: [
      'https://node.kagosida.org.np',
      'https://kagosidaapi.autonomoustechnology.net',
    ],
    pages: ['/'],
    seeds: [
      '/api/v1/getcurrentrate', '/api/v1/rate', '/api/v1/rates', '/api/rate',
      '/api/currentrate', '/api/current-rate', '/api/todayrate',
    ],
    subs: ['api', 'backend', 'server'],
  },
  {
    name: 'FENEGOSIDA', via: 'fenegosida.org',
    kvKey: 'silver-endpoint-fenegosida',
    origins: ['https://www.fenegosida.org'],
    pages: ['/', '/rate-history.php'],
    seeds: [
      '/api/v1/rate', '/api/v1/rates', '/api/v1/getcurrentrate', '/api/v1/todays-rate',
      '/api/rate', '/api/rates', '/api/today-rate', '/api/current-rate',
      '/ajax/rate.php', '/getrate.php', '/rate.php', '/api/rate.php',
    ],
    subs: ['api', 'backend', 'admin', 'server', 'data'],
  },
  /* Last resort. Both associations serve JavaScript-rendered sites and lock
     their APIs, so when neither answers the rate is read from a page that
     republishes FENEGOSIDA's official figure. It is the same federation rate —
     `via` records that it came the long way round — and it is only ever used
     when both associations have refused. */
  {
    name: 'FENEGOSIDA', via: 'arthakendra.com (republished)',
    kvKey: 'silver-endpoint-republished',
    origins: ['https://arthakendra.com'],
    pages: ['/widget/gold-silver-widget', '/gold-silver-price-in-nepal'],
    htmlOnly: true,
    lastResort: true,
  },
];

const rateFirst = (arr) => arr.sort((a, b) =>
  (/currentrate|todayrate|today-rate/i.test(a) ? 0 : /rate|price/i.test(a) ? 1 : 2) -
  (/currentrate|todayrate|today-rate/i.test(b) ? 0 : /rate|price/i.test(b) ? 1 : 2));

async function discoverEndpoints(cfg, log) {
  const apiPaths = new Set(cfg.seeds);
  const bases = new Set();

  for (const origin of cfg.origins) {
    let home = '';
    try { home = await getText(origin + '/'); } catch (e) { log.push(`${cfg.name} home fail ${origin}: ${e.message}`); continue; }
    bases.add(origin);

    const scripts = [...home.matchAll(/(?:src|href)="([^"]+\.js[^"]*)"/g)]
      .map((m) => m[1])
      .map((s) => (s.startsWith('http') ? s : origin + (s.startsWith('/') ? '' : '/') + s));
    log.push(`${cfg.name} bundles: ${scripts.length}`);

    for (const s of scripts.slice(0, 4)) {
      let js = '';
      try { js = await getText(s); } catch (e) { log.push(`${cfg.name} bundle fail: ${e.message}`); continue; }
      for (const m of js.matchAll(/["'`](\/(?:api|backend)\/[^"'`\s\\?]*)["'`]/g)) apiPaths.add(m[1]);
      for (const m of js.matchAll(/https?:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[A-Za-z0-9._~\/-]*)?/g)) {
        const u = m[0].replace(/[.,;'")\\]+$/, '');
        if (STATIC_HOST_RE.test(u) || ASSET_RE.test(u)) continue;
        try {
          const { origin: o, pathname } = new URL(u);
          bases.add(o);
          const pm = pathname.match(/^(.*?\/(?:api|backend)(?:\/v\d+)?)(?:\/|$)/);
          if (pm) bases.add(o + pm[1]);
        } catch { /* not a URL */ }
      }
      for (const m of js.matchAll(/base(?:URL|Url|_url)?\s*[:=]\s*["'`](https?:\/\/[^"'`]+)["'`]/g)) {
        try { bases.add(new URL(m[1]).origin); bases.add(m[1].replace(/\/$/, '')); } catch { /* ignore */ }
      }
    }
  }

  const host = new URL(cfg.origins[0]).hostname.replace(/^www\./, '');
  for (const b of cfg.extraBases || []) bases.add(b);
  for (const sub of cfg.subs) bases.add(`https://${sub}.${host}`);
  // the bundle also references the framework and the agency that built it, so
  // keep only hosts on this source's own domain — matching the base domain, in
  // case the backend lives on a sibling host
  const parts = host.split('.');
  const twoPartTld = /\.(org|com|net|gov|edu|co)\.[a-z]{2}$/i.test(host);
  const baseDomain = parts.slice(twoPartTld ? -3 : -2).join('.');
  // .at() — parts[-3] is not an index in JavaScript and yields undefined
  const name = parts.at(twoPartTld ? -3 : -2) || host;   // e.g. "kagosida"

  /* A backend often lives on a different domain from the site that uses it, so
     hosts found in the bundle are kept even when they are off-domain — only
     framework and CDN noise is dropped. Own-domain and name-matching hosts are
     tried first. */
  for (const b of [...bases]) {
    try {
      const h = new URL(b).hostname;
      if (/^(localhost|127\.|0\.0\.0\.0)/.test(h) || STATIC_HOST_RE.test(h)) bases.delete(b);
    } catch { bases.delete(b); }
  }
  const known = new Set(cfg.extraBases || []);
  const rank = (b) => {
    if (known.has(b)) return -1;      // told to us, not guessed
    const h = (() => { try { return new URL(b).hostname; } catch { return ''; } })();
    if (h.includes(name) && /api|backend|server/i.test(h)) return 0;   // kagosidaapi.…
    if (h.endsWith(baseDomain)) return 1;
    if (h.includes(name)) return 2;
    return 3;
  };

  const paths = rateFirst([...apiPaths]);
  // a host with "api" in its name is the likeliest backend — ask it first
  const ordered = [...bases].sort((a, b) => rank(a) - rank(b));
  log.push(`${cfg.name} hosts: ${ordered.slice(0, 4).join(', ')}`);
  const candidates = [];
  for (const base of ordered) {
    for (const p of paths.slice(0, 8)) {
      let basePath = '';
      try { basePath = new URL(base).pathname; } catch { /* ignore */ }
      const stem = base.replace(/\/$/, '');
      if (basePath.includes('/api')) {
        candidates.push(stem + (p.replace(/^\/api/, '') || '/'));
      } else {
        candidates.push(stem + p);
        // an api.* host often serves the same route without the /api prefix
        if (/api/i.test(new URL(base).hostname)) {
          const bare = p.replace(/^\/api/, '');
          if (bare && bare !== p) candidates.push(stem + bare);
        }
      }
    }
  }
  // candidates are already built api-host-first with paths in priority order;
  // re-sorting them globally meant only the top one or two path shapes were
  // ever reached before the budget ran out
  return [...new Set(candidates)].slice(0, 26);
}

async function scrapeSource(cfg, env, log) {
  const tryUrl = async (url, allowHtml = false, method = 'GET') => {
    const body = await getText(url, cfg.origins[0], method);
    if (!allowHtml && SPA_ECHO_RE.test(body)) throw new Error('SPA html echo');
    const q = extractQuote(body);
    if (!q || !q.sale) throw new Error('no silver in response');
    return q;
  };

  // 1. the endpoint that worked last time
  let known = memEndpoint[cfg.name];
  if (!known && env.RATE_CACHE) {
    try { known = await env.RATE_CACHE.get(cfg.kvKey); } catch { /* ignore */ }
  }
  if (known) {
    try {
      const quote = await tryUrl(known, /\.php$|\/$/.test(known));
      log.push(`${cfg.name} ok (cached endpoint)`);
      memEndpoint[cfg.name] = known;
      // persist it: a fresh worker should not have to rediscover the API
      if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(cfg.kvKey, known); } catch { /* ignore */ } }
      return { quote, endpoint: known };
    } catch (e) { log.push(`${cfg.name} cached endpoint failed: ${e.message}`); }
  }

  // 2. the pages themselves, in case the rate is server-rendered
  for (const origin of cfg.origins) {
    for (const page of cfg.pages || ['/']) {
      const url = origin + page;
      try {
        const quote = await tryUrl(url, true);
        log.push(`${cfg.name} ok from html ${url}`);
        memEndpoint[cfg.name] = url;
        if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(cfg.kvKey, url); } catch { /* ignore */ } }
        return { quote, endpoint: url };
      } catch (e) { log.push(`${cfg.name} html miss ${url}: ${e.message}`); }
    }
  }

  if (cfg.htmlOnly) throw new Error(`${cfg.name}${cfg.via ? ' via ' + cfg.via : ''}: page had no rate`);

  // 3. hunt for the API the bundle talks to
  const candidates = (await discoverEndpoints(cfg, log)).slice(0, 20);
  const strikes = new Map();          // per host: how many times it has refused
  const dead = new Set();
  const postLater = [];               // known-host paths that 404'd on GET

  for (const url of candidates) {
    let base = '';
    try { base = new URL(url).host; } catch { /* ignore */ }
    if (dead.has(base)) continue;     // costs nothing, spends no budget
    try {
      const quote = await tryUrl(url);
      log.push(`${cfg.name} ok via ${url}${quote.purchase ? '' : ' (sale only)'}`);
      memEndpoint[cfg.name] = url;
      if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(cfg.kvKey, url); } catch { /* ignore */ } }
      return { quote, endpoint: url };
    } catch (e) {
      log.push(`${cfg.name} miss ${url}: ${e.message}`);
      /* A 404 only means that path is wrong — the next one may be right, so it
         never condemns a host. A 5xx means the host does not resolve, a 401/403
         means it refuses us whatever the path, and an SPA echo means it answers
         every unknown path with the app shell. Those are host-level, so stop
         after two rather than working through the whole list. */
      if (/HTTP (404|405)/.test(e.message) && (cfg.extraBases || []).some((b) => url.startsWith(b))) {
        postLater.push(url);
      }
      const hostLevel = /HTTP (5\d\d|401|403)|SPA html echo/.test(e.message);
      if (hostLevel && base) {
        const n = (strikes.get(base) || 0) + 1;
        strikes.set(base, n);
        if (n >= 2) {
          dead.add(base);
          log.push(`${cfg.name} giving up on ${base} after ${n} refusals`);
        }
      }
      if (/budget spent/.test(e.message)) break;
    }
  }
  /* Some rate APIs answer only to POST. Now that every GET has been tried,
     spend whatever budget is left asking the most likely paths again. */
  for (const url of postLater.slice(0, 5)) {
    try {
      const quote = await tryUrl(url, false, 'POST');
      log.push(`${cfg.name} ok via POST ${url}`);
      memEndpoint[cfg.name] = url;
      if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(cfg.kvKey, url); } catch { /* ignore */ } }
      return { quote, endpoint: url };
    } catch (e) {
      log.push(`${cfg.name} miss POST ${url}: ${e.message}`);
      if (/budget spent/.test(e.message)) break;
    }
  }

  throw new Error(`${cfg.name}: no working endpoint found`);
}

/* ========================= combined scrape ======================== */
/* Absolute floor and ceiling for silver per tola in Nepal. Dates, percentages
   and stray page numbers all fall outside this; adjust if the market ever
   genuinely moves beyond it. */
const TOLA_MIN = 2500;
const TOLA_MAX = 25000;
// 24-carat gold per tola; wide enough for real movement, tight enough to catch
// a mis-read figure or a 22-carat row pasted into the wrong field
const GOLD_TOLA_MIN = 80000;
const GOLD_TOLA_MAX = 900000;

/* One tola is exactly 11.6638 g, so a genuine pair must sit within rounding
   distance of that ratio. A loose band let a mis-read tola pass alongside a
   correct 10-gram figure; anything outside ±1.5% now means one of the two was
   read off the wrong part of the page, and the whole reading is discarded. */
function sane(ref) {
  if (!ref) return false;
  if (!(ref.tola > 0 && ref.g10 > 0)) return false;
  const r = ref.tola / ref.g10;
  if (r < TOLA_PER_10G * 0.985 || r > TOLA_PER_10G * 1.015) return false;
  return ref.tola >= TOLA_MIN && ref.tola <= TOLA_MAX;
}

/* Silver does not move 50% overnight. A figure that far from the last known
   rate is almost certainly a mis-read of some other number on the page, so it
   is only published if a second, independent source reports the same thing. */
const MAX_DAILY_MOVE = 0.18;
// silver does not halve or double in a day; beyond this a reading is refused
// outright, however many sources repeat it
const IMPOSSIBLE_MOVE = 0.4;
const near = (a, b, tol) => a > 0 && b > 0 && Math.abs(a - b) / b <= tol;

/** Ask the sources in order and publish only a figure we can stand behind. */
async function scrape(env, log, prev) {
  budget = 48;   // shared across the sources, under the per-invocation cap
  floor = 0;
  const seen = [];
  for (const cfg of SOURCES) {
    // a page-only source needs a couple of requests; one that must hunt for an
    // API gets more, but never enough to starve the sources behind it
    floor = Math.max(0, budget - (cfg.htmlOnly ? 3 : cfg.extraBases ? 26 : 16));
    try {
      const { quote } = await scrapeSource(cfg, env, log);
      if (!sane(quote.sale) || (quote.purchase && !sane(quote.purchase))) {
        log.push(`${cfg.name} (${cfg.via}) values failed sanity check`);
        continue;
      }
      const hit = { quote, source: cfg.name, via: cfg.via || null };
      const tola = quote.sale.tola;

      if (quote.trusted) {
        log.push(`${cfg.via} published ${tola} as structured data — taken as authoritative`);
        floor = 0;
        return hit;
      }

      // A figure in line with the last confirmed rate is published as-is.
      if (prev && near(tola, prev, MAX_DAILY_MOVE)) {
        log.push(`${cfg.via} says ${tola}, in line with the confirmed ${prev}`);
        floor = 0;
        return hit;
      }

      // Anything unusual has to be backed by a second route before it goes out.
      const agrees = seen.find((o) => near(o.quote.sale.tola, tola, 0.03));
      if (agrees) {
        // keep the higher-priority source's reading — it was asked first for a
        // reason, and it is the one more likely to carry a purchase rate too
        log.push(`agreed: ${agrees.via} and ${cfg.via} both say ${tola}`);
        floor = 0;
        return agrees;
      }

      log.push(`${cfg.name} (${cfg.via}) says ${tola}${prev ? ` (last confirmed ${prev})` : ''}; waiting for a second source to confirm`);
      seen.push(hit);
    } catch (e) { log.push(`${cfg.name} (${cfg.via}): ${e.message}`); }
  }
  floor = 0;

  // Only one source was reachable. It is published solely if it sits close to
  // a rate already confirmed earlier; otherwise the site says nothing rather
  // than risk quoting a customer a number no one else agrees with.
  if (seen.length === 1) {
    const only = seen[0];
    if (!prev) {
      log.push(`only ${only.via} responded and there is nothing to compare with; publishing it`);
      return only;
    }
    throw new Error(`only ${only.via} responded (${only.quote.sale.tola}) and nothing confirms it`);
  }
  if (seen.length) {
    throw new Error(`sources disagree: ${seen.map((o) => `${o.via}=${o.quote.sale.tola}`).join(', ')}`);
  }
  throw new Error('all sources failed');
}

/* ========================= quote & cache ========================== */
const round50 = (x) => Math.round(x * 2) / 2;

function nptNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/* DPPL buys back at a fixed margin under the day's sale rate, so the purchase
   figure is set here rather than taken from whatever a rate page publishes.
   Every figure is rounded to the nearest half rupee: 4,588.15 becomes 4,588.00
   and 4,588.48 becomes 4,588.50. */
const DEALER_SPREAD = 0.04;
const toHalf = (n) => Math.round(n * 2) / 2;

function buildPayload(quote, source, day, minutes, updatedToday) {
  /* The tola rate is the primary quote in Nepal and is taken exactly as
     published. The ten-gram figure is then derived from it and rounded to the
     nearest half rupee, which is the convention FENEGOSIDA itself uses:
     4,765 ÷ 11.6638 = 4,085.44 → 4,085.50. Rate sites that round to a whole
     rupee would otherwise report 4,086. */
  const tola = r2(quote.sale.tola);
  const sale = { tola, g10: toHalf(tola / TOLA_PER_10G) };   // refined below if the source states one

  /* KAGOSIDA publishes its own buy-back rate, so that is what gets quoted.
     FENEGOSIDA publishes only the official sale rate, so there the buy-back
     is worked out at the house margin. */
  const published = !!quote.purchase && Number.isFinite(quote.purchase.tola)
    && quote.purchase.tola > 0 && quote.purchase.tola < sale.tola;

  /* Prefer a ten-gram figure the source states itself, provided it agrees with
     the tola rate — the association's own rounding beats our arithmetic. */
  const agrees = (g10, t) => Number.isFinite(g10) && g10 > 0
    && Math.abs(g10 - t / TOLA_PER_10G) / (t / TOLA_PER_10G) < 0.01;
  if (quote.sale.g10Given && agrees(quote.sale.g10, sale.tola)) sale.g10 = r2(quote.sale.g10);

  const purchase = published
    ? {
        tola: r2(quote.purchase.tola),
        g10: quote.purchase.g10Given && agrees(quote.purchase.g10, quote.purchase.tola)
          ? r2(quote.purchase.g10)
          : toHalf(quote.purchase.tola / TOLA_PER_10G),
      }
    : { tola: toHalf(sale.tola * (1 - DEALER_SPREAD)), g10: toHalf(sale.g10 * (1 - DEALER_SPREAD)) };
  /* Gold is quoted exactly as the association publishes it. Where it gives no
     buy-back figure the house margin applies, the same as for silver. */
  let gold = null;
  if (quote.gold?.sale) {
    const gs = {
      tola: r2(quote.gold.sale.tola),
      g10: quote.gold.sale.g10Given ? r2(quote.gold.sale.g10) : toHalf(quote.gold.sale.tola / TOLA_PER_10G),
    };
    const gp = quote.gold.purchase?.tola
      ? {
          tola: r2(quote.gold.purchase.tola),
          g10: quote.gold.purchase.g10Given ? r2(quote.gold.purchase.g10) : toHalf(quote.gold.purchase.tola / TOLA_PER_10G),
        }
      : { tola: toHalf(gs.tola * (1 - DEALER_SPREAD)), g10: toHalf(gs.g10 * (1 - DEALER_SPREAD)) };
    gold = {
      tolaSale: gs.tola, tolaPurchase: gp.tola,
      g10Sale: gs.g10, g10Purchase: gp.g10,
      purchaseDerived: !quote.gold.purchase?.tola,
      carat: 24,
    };
  }

  return {
    tolaSale: sale.tola,
    tolaPurchase: purchase.tola,
    g10Sale: sale.g10,
    g10Purchase: purchase.g10,
    gold,
    purchaseDerived: !published,
    spread: published ? null : DEALER_SPREAD,
    reference: { tola: sale.tola, g10: sale.g10 },
    dateAD: day,
    fetchedAt: new Date().toISOString(),
    fetchedMinutes: minutes,
    lastAttempt: Date.now(),
    updatedToday,
    source,
  };
}

/** A stored payload has to pass the same test a fresh reading would. */
function usablePayload(v) {
  return !!v && Number.isFinite(v.tolaSale) && v.tolaSale >= TOLA_MIN && v.tolaSale <= TOLA_MAX
    && !isYear(v.tolaSale);
}

/* A rate stored before the gold board was added has no `gold` key at all —
   distinct from `gold: null`, which means the source genuinely had none. The
   older shape is refreshed at once rather than served until it expires. */
const predatesGold = (v) => !!v && !('gold' in v);

async function readCache(env) {
  let v = null;
  if (env.RATE_CACHE) {
    try { v = await env.RATE_CACHE.get(KV_KEY, 'json'); } catch { /* ignore */ }
  }
  if (!v) v = memCache;
  if (v && !usablePayload(v)) {
    // written before these checks existed, or simply wrong — drop it and
    // re-scrape rather than serve it for another minute
    console.warn('[silver] discarding unusable cached rate', v.tolaSale);
    return null;
  }
  return v;
}
async function writeCache(env, data) {
  memCache = data;
  if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(KV_KEY, JSON.stringify(data)); } catch { /* ignore */ } }
}

// Re-check every few minutes rather than trusting one reading for the whole
// day. The rate itself rarely moves, but a bad reading now corrects itself
// instead of sitting on the page until tomorrow.
const REFRESH_MS = 5 * 60 * 1000;

function shouldScrape(cached, day, minutes, force) {
  if (force) return true;
  const since = (t) => {
    const d = Date.now() - (t || 0);
    return d < 0 ? Infinity : d;   // a future timestamp must not block forever
  };
  if (!cached) return since(lastFailAt) > FAIL_RETRY_MS;
  // yesterday's cache is not today's price, so keep trying — but not on
  // literally every request while a source is refusing
  if (cached.dateAD !== day) return since(cached.lastAttempt) > FAIL_RETRY_MS;
  const afterPublish = minutes >= PUBLISH_MINUTES;
  if (!afterPublish) return false;
  if (cached.fetchedMinutes < PUBLISH_MINUTES) return true;
  if (!cached.updatedToday && minutes <= RETRY_WINDOW_END &&
      since(cached.lastAttempt) > RETRY_GAP_MS) return true;
  if (predatesGold(cached)) return true;
  return since(cached.lastAttempt) > REFRESH_MS;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const debug = url.searchParams.has('debug');
  const force = url.searchParams.has('refresh') || url.searchParams.has('debug');

  // Edge cache: under load, most requests are answered straight from the
  // Cloudflare data center without touching KV or this function's logic.
  const cacheKey = new Request(new URL(`/api/silver${force ? '?refresh=1' : ''}`, request.url).toString());
  if (!debug) {
    const hit = force ? null : await caches.default.match(cacheKey);
    if (hit) return hit;
  }

  const { day, minutes } = nptNow();
  let cached = await readCache(env);
  const log = [];

  /* A rate entered by hand at the counter. Set the KV key `manual-rate` to
     {"dateAD":"2026-09-03","tolaSale":4725,"tolaPurchase":4536,
      "g10Sale":4051,"g10Purchase":3888,"source":"KAGOSIDA"}
     and it is published for that day, ahead of anything scraped. It is ignored
     the moment its date is not today, so it can never go stale. */
  if (env.RATE_CACHE) {
    try {
      const manual = await env.RATE_CACHE.get(MANUAL_KEY, 'json');
      if (manual && manual.dateAD === day && Number.isFinite(manual.tolaSale)) {
        const payload = {
          tolaSale: manual.tolaSale,
          tolaPurchase: Number.isFinite(manual.tolaPurchase) ? manual.tolaPurchase : toHalf(manual.tolaSale * (1 - DEALER_SPREAD)),
          g10Sale: Number.isFinite(manual.g10Sale) ? manual.g10Sale : toHalf(manual.tolaSale / TOLA_PER_10G),
          g10Purchase: Number.isFinite(manual.g10Purchase) ? manual.g10Purchase : toHalf(manual.tolaSale * (1 - DEALER_SPREAD) / TOLA_PER_10G),
          gold: Number.isFinite(manual.goldTolaSale)
            ? {
                tolaSale: manual.goldTolaSale,
                tolaPurchase: Number.isFinite(manual.goldTolaPurchase) ? manual.goldTolaPurchase : toHalf(manual.goldTolaSale * (1 - DEALER_SPREAD)),
                g10Sale: Number.isFinite(manual.goldG10Sale) ? manual.goldG10Sale : toHalf(manual.goldTolaSale / TOLA_PER_10G),
                g10Purchase: Number.isFinite(manual.goldG10Purchase) ? manual.goldG10Purchase : toHalf(manual.goldTolaSale * (1 - DEALER_SPREAD) / TOLA_PER_10G),
                purchaseDerived: !Number.isFinite(manual.goldTolaPurchase),
                carat: 24,
              }
            : null,
          reference: { tola: manual.tolaSale, g10: manual.g10Sale || null },
          dateAD: day,
          fetchedAt: new Date().toISOString(),
          fetchedMinutes: minutes,
          updatedToday: true,
          source: manual.source === 'FENEGOSIDA' ? 'FENEGOSIDA' : 'KAGOSIDA',
          via: 'set at the counter',
          manual: true,
          stale: false,
          ...(debug ? { trace: ['manual rate in KV for today; nothing scraped'] } : {}),
        };
        const out = json(payload);
        if (!debug && !force) context.waitUntil(caches.default.put(cacheKey, out.clone()));
        return out;
      }
    } catch { /* fall through to scraping */ }
  }

  if (shouldScrape(cached, day, minutes, force)) {
    try {
      const { quote, source, via } = await scrape(env, log, cached?.tolaSale ?? null);
      const changed = !cached || cached.tolaSale !== r2(quote.sale.tola);
      const updatedToday = changed || (!!cached?.updatedToday && cached.dateAD === day);
      cached = { ...buildPayload(quote, source, day, minutes, updatedToday), via };
      await writeCache(env, cached);
    } catch (err) {
      log.push(`FINAL: ${err.message}`);
      console.error('[silver]', log.join(' | '));
      lastFailAt = Date.now();
      if (cached) {
        cached = { ...cached, lastAttempt: Date.now() };
        await writeCache(env, cached);
      }
    }
  }

  // Only today's rate is ever published. An older figure would look live and
  // send someone to the counter expecting the wrong price, so it is withheld
  // and the site says the rate is unavailable instead.
  if (!cached || cached.dateAD !== day) {
    if (!log.length) {
      log.push(`no attempt on this request: last try ${Math.round((Date.now() - (cached?.lastAttempt || 0)) / 1000)}s ago, retry gap ${FAIL_RETRY_MS / 1000}s — add ?refresh=1 to force one`);
    }
    return json({
      error: 'Today\u2019s rate is not available yet. Please call the counter on 01-5915052.',
      ...(debug ? { trace: log, heldBack: cached ? { dateAD: cached.dateAD, tolaSale: cached.tolaSale } : null } : {}),
    }, 503);
  }

  const resp = json({ ...cached, stale: false, ...(debug ? { trace: log } : {}) });
  if (!debug && !force) context.waitUntil(caches.default.put(cacheKey, resp.clone()));
  return resp;
}
