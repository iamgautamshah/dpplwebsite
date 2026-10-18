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

   _routes.json limits Functions to "/" and "/api/*", so this never runs for
   images, scripts or the other pages. */

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

export async function onRequest(context) {
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
