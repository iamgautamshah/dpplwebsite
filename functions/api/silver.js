
const KAGOSIDA = 'https://kagosida.org.np';
const FENEGOSIDA_SOURCES = ['https://www.fenegosida.org/', 'https://fenegosida.org/'];
const KV_KEY = 'silver';
const KV_ENDPOINT_KEY = 'silver-endpoint';
const PUBLISH_MINUTES = 10 * 60 + 55; // 10:55 NPT
const RETRY_WINDOW_END = 15 * 60;     // keep retrying until 3:00 PM NPT
const RETRY_GAP_MS = 15 * 60 * 1000;
const TOLA_PER_10G = 1.16638;         // (11.6638 g/tola) ÷ 10 g

let memCache = null;
let memEndpoint = null;

const UA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ne;q=0.8',
};

async function getText(url) {
  const res = await fetch(url, { headers: UA_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* =================== silver sale/purchase extraction =================== */
const NUM_RE = '(\\d+(?:,\\d{3})*(?:\\.\\d+)?)';  // commas only as thousands separators
const num = (s) => parseFloat(String(s).replace(/,/g, ''));
const r2 = (x) => Math.round(x * 100) / 100;

/** Normalize Devanagari + escaped-unicode keywords into English markers. */
function normalize(raw) {
  return raw
    .replace(/\\u091a\\u093e(?:\\u0901)?\\u0926\\u0940/g, 'silver')  // चाँदी escaped
    .replace(/चा[ँ]?दी/g, 'silver')
    .replace(/\\u092c\\u093f\\u0915\\u094d\\u0930\\u0940/g, 'sale')  // बिक्री escaped
    .replace(/बिक्री|बिक्रि/g, 'sale')
    .replace(/\\u0916\\u0930\\u093f\\u0926/g, 'purchase')            // खरिद escaped
    .replace(/खरिद/g, 'purchase')
    .replace(/&nbsp;|&#160;|\u00A0/g, ' ');
}

function plausible(unit, v) {
  if (unit === 'tola') return v >= 800 && v <= 50000;
  if (unit === 'g10') return v >= 600 && v <= 45000;
  if (unit === 'gram') return v >= 60 && v <= 4500;
  if (unit === 'kg') return v >= 60000 && v <= 4500000;
  return false;
}

function fromUnits(u) {
  if (!u) return null;
  if (u.tola && u.g10) return { tola: u.tola, g10: u.g10 };
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
function extractQuote(raw) {
  const text = normalize(raw);
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
    let sale = fromUnits(Object.keys(acc.sale).length ? acc.sale : null);
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

function collectNums(region) {
  const out = [];
  for (const m of region.matchAll(new RegExp(NUM_RE, 'g'))) {
    const v = num(m[1]);
    if (v >= 60 && v <= 4500000 && !out.includes(v)) out.push(v);
  }
  return out;
}

/* ======================= KAGOSIDA (primary) ======================= */
const STATIC_HOST_RE = /(googleapis|gstatic|w3\.org|reactjs\.org|react\.dev|facebook|fbcdn|twitter|x\.com|youtube|youtu\.be|instagram|linkedin|jsdelivr|unpkg|cdnjs|cloudflareinsights|schema\.org|sentry|googletagmanager|google-analytics|maps\.google|goo\.gl|fonts\.|gravatar|wikipedia|github\.io|npmjs)/i;
const ASSET_RE = /\.(png|jpe?g|svg|gif|webp|css|map|woff2?|ttf|eot|ico|mp4|pdf)(\?|#|$)/i;
const SPA_ECHO_RE = /^\s*<!doctype html|^\s*<html/i;

async function discoverKagosidaEndpoints(log) {
  const home = await getText(KAGOSIDA + '/');
  const scripts = [...home.matchAll(/(?:src|href)="([^"]+\.js[^"]*)"/g)]
    .map((m) => m[1])
    .map((s) => (s.startsWith('http') ? s : KAGOSIDA + (s.startsWith('/') ? '' : '/') + s));
  log.push(`bundles: ${scripts.length}`);

  const apiPaths = new Set(['/api/v1/getcurrentrate', '/api/v1/getratehistory']);
  const bases = new Set();

  for (const s of scripts.slice(0, 4)) {
    let js = '';
    try { js = await getText(s); } catch (e) { log.push(`bundle fail: ${e.message}`); continue; }
    for (const m of js.matchAll(/["'`](\/(?:api|backend)\/[^"'`\s\\?]*)["'`]/g)) apiPaths.add(m[1]);
    for (const m of js.matchAll(/https?:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[A-Za-z0-9._~\/-]*)?/g)) {
      const u = m[0].replace(/[.,;'")\\]+$/, '');
      if (STATIC_HOST_RE.test(u) || ASSET_RE.test(u)) continue;
      try {
        const { origin, pathname } = new URL(u);
        if (origin === KAGOSIDA) continue;
        bases.add(origin);
        const pm = pathname.match(/^(.*?\/(?:api|backend)(?:\/v\d+)?)(?:\/|$)/);
        if (pm) bases.add(origin + pm[1]);
      } catch { /* not a URL */ }
    }
    for (const m of js.matchAll(/base(?:URL|Url|_url)?\s*[:=]\s*["'`](https?:\/\/[^"'`]+)["'`]/g)) {
      try { bases.add(new URL(m[1]).origin); bases.add(m[1].replace(/\/$/, '')); } catch { /* ignore */ }
    }
  }
  for (const sub of ['api', 'backend', 'admin', 'server']) bases.add(`https://${sub}.kagosida.org.np`);
  log.push(`hosts: ${[...bases].filter((b) => !b.includes('/api')).join(', ') || 'none found in bundle'}`);

  const rateFirst = (arr) => arr.sort((a, b) =>
    (/currentrate/i.test(a) ? 0 : /rate|price/i.test(a) ? 1 : 2) -
    (/currentrate/i.test(b) ? 0 : /rate|price/i.test(b) ? 1 : 2));
  const paths = rateFirst([...apiPaths]);

  const candidates = [];
  for (const base of bases) {
    for (const p of paths.slice(0, 6)) {
      candidates.push(base.replace(/\/$/, '') + (base.includes('/api') ? p.replace(/^\/api(?:\/v\d+)?/, '') || '/' : p));
    }
  }
  return rateFirst([...new Set(candidates)]).slice(0, 24);
}

async function scrapeKagosida(env, log) {
  const tryEndpoint = async (url) => {
    const body = await getText(url);
    if (SPA_ECHO_RE.test(body)) throw new Error('SPA html echo');
    const q = extractQuote(body);
    if (!q || !q.sale) throw new Error('no silver in response');
    return q;
  };

  let known = memEndpoint;
  if (!known && env.RATE_CACHE) {
    try { known = await env.RATE_CACHE.get(KV_ENDPOINT_KEY); } catch { /* ignore */ }
  }
  if (known) {
    try {
      const quote = await tryEndpoint(known);
      log.push('kagosida ok (cached endpoint)');
      return { quote, endpoint: known };
    } catch (e) { log.push(`cached endpoint failed: ${e.message}`); }
  }

  const candidates = await discoverKagosidaEndpoints(log);
  const score = (u) => /currentrate/i.test(u) ? 0 : /rate|price/i.test(u) ? 1 : 2;
  for (const url of candidates) {
    try {
      const body = await getText(url);
      if (SPA_ECHO_RE.test(body)) { log.push(`miss ${url}: SPA html echo (not the API host)`); continue; }
      const q = extractQuote(body);
      if (!q || !q.sale) {
        log.push(score(url) < 2
          ? `miss ${url}: no silver in body: ${body.slice(0, 260).replace(/\s+/g, ' ')}`
          : `miss ${url}: no silver in response`);
        continue;
      }
      log.push(`kagosida ok via ${url}${q.purchase ? '' : ' (sale only)'}`);
      memEndpoint = url;
      if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(KV_ENDPOINT_KEY, url); } catch { /* ignore */ } }
      return { quote: q, endpoint: url };
    } catch (e) { log.push(`miss ${url}: ${e.message}`); }
  }
  throw new Error('kagosida: no working endpoint found');
}

/* ====================== FENEGOSIDA (fallback) ===================== */
async function scrapeFenegosida(log) {
  for (const url of FENEGOSIDA_SOURCES) {
    try {
      const q = extractQuote(await getText(url));
      if (q && q.sale) { log.push(`fenegosida ok via ${url}`); return { quote: q, endpoint: url }; }
      log.push(`fenegosida parse empty: ${url}`);
    } catch (e) { log.push(`fenegosida fail ${url}: ${e.message}`); }
  }
  throw new Error('fenegosida: no rate found');
}

/* ========================= combined scrape ======================== */
function sane(ref) {
  if (!ref) return false;
  const r = ref.tola / ref.g10;
  return ref.tola > 0 && ref.g10 > 0 && r > 1.1 && r < 1.25;
}

async function scrape(env, log) {
  try {
    const { quote } = await scrapeKagosida(env, log);
    if (sane(quote.sale) && (!quote.purchase || sane(quote.purchase))) {
      return { quote, source: 'KAGOSIDA' };
    }
    log.push('kagosida values failed sanity check');
  } catch (e) { log.push(e.message); }
  const { quote } = await scrapeFenegosida(log);
  if (!sane(quote.sale)) throw new Error('all sources failed sanity check');
  return { quote, source: 'FENEGOSIDA' };
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

function buildPayload(quote, source, day, minutes, updatedToday, prevRatio) {
  const sale = quote.sale;
  let purchase = quote.purchase;
  let purchaseDerived = false;
  if (!purchase) {
    // Source published no buyback price — estimate from the last known
    // KAGOSIDA sale↔purchase ratio (default 0.96 until one is learned).
    const ratio = prevRatio && prevRatio > 0.85 && prevRatio < 1 ? prevRatio : 0.96;
    purchase = { tola: round50(sale.tola * ratio), g10: round50(sale.g10 * ratio) };
    purchaseDerived = true;
  }
  return {
    tolaSale: r2(sale.tola),
    tolaPurchase: r2(purchase.tola),
    g10Sale: r2(sale.g10),
    g10Purchase: r2(purchase.g10),
    purchaseDerived,
    reference: { tola: sale.tola, g10: sale.g10 },
    dateAD: day,
    fetchedAt: new Date().toISOString(),
    fetchedMinutes: minutes,
    lastAttempt: Date.now(),
    updatedToday,
    source,
  };
}

async function readCache(env) {
  if (env.RATE_CACHE) { try { return await env.RATE_CACHE.get(KV_KEY, 'json'); } catch { /* ignore */ } }
  return memCache;
}
async function writeCache(env, data) {
  memCache = data;
  if (env.RATE_CACHE) { try { await env.RATE_CACHE.put(KV_KEY, JSON.stringify(data)); } catch { /* ignore */ } }
}

function shouldScrape(cached, day, minutes) {
  if (!cached) return true;
  if (cached.dateAD !== day) return true;
  const afterPublish = minutes >= PUBLISH_MINUTES;
  if (!afterPublish) return false;
  if (cached.fetchedMinutes < PUBLISH_MINUTES) return true;
  if (!cached.updatedToday && minutes <= RETRY_WINDOW_END &&
      Date.now() - (cached.lastAttempt || 0) > RETRY_GAP_MS) return true;
  return false;
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
  const debug = new URL(request.url).searchParams.has('debug');

  // Edge cache: under load, most requests are answered straight from the
  // Cloudflare data center without touching KV or this function's logic.
  const cacheKey = new Request(new URL('/api/silver', request.url).toString());
  if (!debug) {
    const hit = await caches.default.match(cacheKey);
    if (hit) return hit;
  }

  const { day, minutes } = nptNow();
  let cached = await readCache(env);
  const log = [];

  if (shouldScrape(cached, day, minutes)) {
    try {
      const { quote, source } = await scrape(env, log);
      const changed = !cached || cached.tolaSale !== r2(quote.sale.tola);
      const updatedToday = changed || (!!cached?.updatedToday && cached.dateAD === day);
      const prevRatio = cached ? cached.tolaPurchase / cached.tolaSale : null;
      cached = buildPayload(quote, source, day, minutes, updatedToday, prevRatio);
      await writeCache(env, cached);
    } catch (err) {
      log.push(`FINAL: ${err.message}`);
      console.error('[silver]', log.join(' | '));
      if (!cached) {
        return json({ error: 'Rate not available yet. Try again shortly.', ...(debug ? { trace: log } : {}) }, 503);
      }
      cached = { ...cached, lastAttempt: Date.now() };
      await writeCache(env, cached);
    }
  }

  const resp = json({ ...cached, stale: cached.dateAD !== day, ...(debug ? { trace: log } : {}) });
  if (!debug) context.waitUntil(caches.default.put(cacheKey, resp.clone()));
  return resp;
}
