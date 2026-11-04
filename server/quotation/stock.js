import catalog from '../../public/quotation/data/products.json';

export const CLOSED_MESSAGE =
  'Sorry for the inconvenience, but we are currently out of stock and not taking quotation requests. Thank you for your patience. Please check back soon.';

/* Availability, set in the admin.
   - A switch per metal (gold, silver) and a switch per product.
   - A product can be quoted only when its own switch and its metal's switch
     are both on. A metal whose products are all off counts as out of stock.
   - With no metal available the quotation form closes.
   Stored in QUOTE_RATES under `stock`: { gold, silver, products: { id: false }, updatedAt }.
   Products are in stock unless switched off, so new catalogue products start in stock. */

const PRODUCT_IDS = new Set(catalog.metals.flatMap((m) => m.products.map((p) => p.id)));
const DEFAULT = { gold: true, silver: true, products: {}, updatedAt: null };

function kv(env) {
  if (!env.QUOTE_RATES) throw new Error('QUOTE_RATES KV binding is missing.');
  return env.QUOTE_RATES;
}

function describe(s) {
  const products = Object.fromEntries(
    catalog.metals.flatMap((m) => m.products.map((p) => [p.id, s.products?.[p.id] !== false])),
  );
  const available = Object.fromEntries(
    catalog.metals.map((m) => [m.id, s[m.id] !== false && m.products.some((p) => products[p.id])]),
  );
  // products a customer cannot quote right now: switched off, or their metal is
  const out = catalog.metals.flatMap((m) => m.products.filter((p) => !available[m.id] || !products[p.id]).map((p) => p.id));
  return {
    gold: s.gold !== false,
    silver: s.silver !== false,
    products,
    available,
    out,
    open: Object.values(available).some(Boolean),
    updatedAt: s.updatedAt ?? null,
  };
}

export async function getStock(env) {
  return describe({ ...DEFAULT, ...((await kv(env).get('stock', 'json')) ?? {}) });
}

/** `products` is optional (older admin pages send only the metal switches). */
export async function saveStock(env, { gold, silver, products }) {
  const current = (await kv(env).get('stock', 'json')) ?? {};
  const off = { ...(current.products ?? {}) };
  if (products && typeof products === 'object') {
    for (const [id, on] of Object.entries(products)) {
      if (!PRODUCT_IDS.has(id) || typeof on !== 'boolean') continue;
      if (on) delete off[id];
      else off[id] = false;
    }
  }
  const s = { gold: !!gold, silver: !!silver, products: off, updatedAt: new Date().toISOString() };
  await kv(env).put('stock', JSON.stringify(s));
  return describe(s);
}

/** What customers are told, for the metal-level view the quotation pages poll. */
export const publicStock = (s) => ({ gold: s.available.gold, silver: s.available.silver, out: s.out, open: s.open });

export const outOfStockMessage = (metalName) => `Sorry, ${metalName.toLowerCase()} is currently out of stock.`;
