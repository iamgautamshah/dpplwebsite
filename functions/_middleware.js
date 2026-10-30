/* Product markup for the homepage, written at the edge with today's price.

   Google's product report rejects an Offer that has no price, and a price
   baked into the static HTML would be wrong by the next morning. So the page
   ships with an empty <!--product-schema--> slot and this middleware fills it
   from the rate the price API has already stored for today.

   Only the gold bar is marked up: it carries no making charge, so the
   published gold rate is exactly what a customer pays per 10 grams. Silver
   bars and coins add a making charge at the counter, so a schema price for
   them would not match the bill — and Google requires the two to match.

   If there is no valid rate for today (before the associations publish, or
   if every source failed), nothing is injected. No markup is better than
   markup with a stale or invented price.

   _routes.json limits Functions to "/", "/api/*" and "/admin*", so this never
   runs for images, scripts or the other pages.

   Before that, adminGate keeps the quotation admin on its own hostname —
   see server/quotation/access.js for why that has to happen in code. */

import { isAdminHost, isAdminPath, verifyAccess } from '../server/quotation/access.js';

const SITE = 'https://dppl.com.np';
const GOLD_G10_MIN = 68000;   // GOLD_TOLA_MIN / 1.16638, with margin
const GOLD_G10_MAX = 780000;  // GOLD_TOLA_MAX / 1.16638, with margin

/** Today's date in Nepal (UTC+05:45), as YYYY-MM-DD. */
function nptDay(now = Date.now()) {
  return new Date(now + (5 * 60 + 45) * 60000).toISOString().slice(0, 10);
}

/** The gold price per 10 g for today, or null. */
async function todaysGold(env, day) {
  if (!env.RATE_CACHE) return null;
  const pick = (v) => {
    if (!v || v.dateAD !== day) return null;
    const g = v.gold ?? (Number.isFinite(v.goldTolaSale)
      ? { g10Sale: v.goldG10Sale ?? Math.round((v.goldTolaSale / 1.16638) * 2) / 2 }
      : null);
    const p = g && Number(g.g10Sale);
    return Number.isFinite(p) && p >= GOLD_G10_MIN && p <= GOLD_G10_MAX ? p : null;
  };
  try {
    const manual = await env.RATE_CACHE.get('manual-rate', 'json');
    const m = pick(manual);
    if (m) return m;
  } catch { /* fall through */ }
  try {
    return pick(await env.RATE_CACHE.get('silver', 'json'));
  } catch {
    return null;
  }
}

export function productSchema(price) {
  const amount = Number(price).toFixed(2);
  const offer = {
    '@type': 'Offer',
    url: `${SITE}/#products`,
    priceCurrency: 'NPR',
    price: amount,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: amount,
      priceCurrency: 'NPR',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 10, unitCode: 'GRM', unitText: '10 gram' },
    },
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${SITE}/#business` },
  };
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE}/#gold-bar`,
    name: 'Fine Gold Bar — 24 carat (999.9)',
    description: '24-carat (999.9) fine gold bar sold by weight at the day\u2019s published gold rate, with no making charge. Weighed in front of you and sold with a full VAT invoice at Diamond Palace Pvt. Ltd., New Road, Kathmandu.',
    image: [`${SITE}/images/bar-gold-9999-v2.webp`],
    sku: 'DPPL-GOLD-BAR-9999',
    category: 'Gold bullion',
    material: '24-carat gold (999.9)',
    brand: { '@type': 'Brand', name: 'Diamond Palace Pvt. Ltd.' },
    offers: offer,
  };
  return `<script type="application/ld+json">${JSON.stringify(product).replace(/</g, '\\u003c')}</script>`;
}

const ADMIN_HEADERS = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'cross-origin-opener-policy': 'same-origin',
  'permissions-policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; '),
};

function withAdminHeaders(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(ADMIN_HEADERS)) out.headers.set(k, v);
  return out;
}

async function notFound(env, request) {
  try {
    const page = await env.ASSETS.fetch(new URL('/404', request.url));
    if (page.ok) {
      return new Response(page.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
    }
  } catch { /* fall through */ }
  return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
}

/* 1 · The admin exists only on the admin hostname, behind Cloudflare Access.
   On dppl.com.np (and *.pages.dev) every admin page and API is a plain 404. */
async function adminGate(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);

  if (!isAdminHost(env, request.url)) {
    return isAdminPath(url.pathname) ? notFound(env, request) : next();
  }

  const access = await verifyAccess(env, request);
  if (!access.ok) {
    console.warn('[admin] Cloudflare Access check failed:', access.reason);
    return withAdminHeaders(new Response('Access denied.', { status: 403, headers: { 'content-type': 'text/plain' } }));
  }
  data.accessEmail = access.email;

  if (url.pathname === '/') return withAdminHeaders(await env.ASSETS.fetch(new URL('/admin/', url)));
  if (isAdminPath(url.pathname)) return withAdminHeaders(await next());
  // the public site's Functions have no business on the admin hostname
  if (url.pathname.startsWith('/api/')) return notFound(env, request);
  return Response.redirect(new URL('/', url).toString(), 302);
}

/* 2 · Product markup with today's gold price on the public homepage. */
async function productMarkup(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const response = await next();

  if (url.pathname !== '/' || request.method !== 'GET' || response.status !== 200) return response;
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;

  let html;
  try {
    html = await response.text();
  } catch {
    return response;
  }
  if (!html.includes('<!--product-schema-->')) {
    return new Response(html, response);
  }

  const day = nptDay();
  let price = null;
  try { price = await todaysGold(env, day); } catch { /* inject nothing */ }
  const body = html.replace('<!--product-schema-->', price ? productSchema(price) : '');

  const headers = new Headers(response.headers);
  headers.delete('ETag');             // the body is not the static file any more
  headers.delete('Content-Length');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return new Response(body, { status: 200, headers });
}

export const onRequest = [adminGate, productMarkup];
