// Injects Product structured data into the page head using the day's real
// rates. Google needs a price inside offers, and ours changes daily, so it is
// stamped in at request time instead of being baked into the build.
// The figure is metal value by weight and excludes making charges, so it is
// published as a floor price (AggregateOffer.lowPrice), not a final price.

const SITE = 'https://dppl.com.np';

const CATALOGUE = [
  {
    grams: 100,
    name: 'DPPL 100g Fine Silver Bar 999',
    image: '/images/bar.webp',
    description:
      '100 gram bar of 999 fine silver, stamped with the DPPL diamond mark, weighed on calibrated scales and sold with a full VAT invoice from New Road, Kathmandu. Price shown is the day\u2019s silver rate by weight and excludes making charges.',
  },
  {
    grams: 500,
    name: 'DPPL 500g Fine Silver Bar 999',
    image: '/images/bar.webp',
    description:
      '500 gram bar of 999 fine silver at a tighter premium per gram, stamped, weighed at the counter and invoiced in full. Price shown is the day\u2019s silver rate by weight and excludes making charges.',
  },
  {
    grams: 1000,
    name: 'DPPL 1kg Fine Silver Bar 999',
    image: '/images/bar.webp',
    description:
      'One kilogram bar of 999 fine silver — the lowest premium per gram DPPL offers, for investors and businesses accumulating in size. Price shown is the day\u2019s silver rate by weight and excludes making charges.',
  },
  {
    grams: 1000,
    name: 'DPPL Silver Grains 999 Fine',
    image: '/images/grains.webp',
    description:
      'Loose 999 fine silver grain for jewellers, manufacturers and ritual use, sold by weight to the exact gram at the day\u2019s rate. Price shown per 1 kg pack.',
  },
];

async function readRates(request) {
  const url = new URL('/api/silver', request.url);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 1200));
  const call = fetch(url.toString(), { cf: { cacheTtl: 300, cacheEverything: true } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return Promise.race([call, timeout]);
}

function buildSchema(rates) {
  const perGram = rates.g10Sale / 10;
  if (!Number.isFinite(perGram) || perGram <= 0) return null;

  // rates are quoted for the day, so the offer is good until tomorrow
  const validUntil = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: CATALOGUE.map((item, i) => ({
      '@type': 'Product',
      position: i + 1,
      name: item.name,
      description: item.description,
      image: SITE + item.image,
      brand: { '@type': 'Brand', name: 'DPPL' },
      material: 'Silver',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: String(Math.round(perGram * item.grams)),
        priceCurrency: 'NPR',
        priceValidUntil: validUntil,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        offerCount: 1,
        url: SITE + '/#products',
        seller: { '@type': 'Organization', name: 'DPPL' },
      },
    })),
  };
}

export async function onRequest(context) {
  const { request } = context;
  const path = new URL(request.url).pathname;

  // the API and static files pass straight through
  if (path.startsWith('/api/')) return context.next();

  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const rates = await readRates(request);
  if (!rates || !rates.g10Sale) return response;

  const schema = buildSchema(rates);
  if (!schema) return response;

  const tag =
    '<script type="application/ld+json">' +
    JSON.stringify(schema).replace(/</g, '\\u003c') +
    '</script>';

  return new HTMLRewriter()
    .on('head', {
      element(head) {
        head.append(tag, { html: true });
      },
    })
    .transform(response);
}
