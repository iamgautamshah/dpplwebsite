import catalog from '../../public/quotation/data/products.json';

const goldProducts = catalog.metals.find((m) => m.id === 'gold').products;
const silverProducts = catalog.metals.find((m) => m.id === 'silver').products;
export const makingKey = (productId) => `making_${productId.replace(/-/g, '_')}`;

export const RATE_FIELDS = {
  goldPerTola: { label: 'Gold price per tola', short: 'Price per tola', group: 'gold', min: 1000, max: 10_000_000 },
  goldPerGram: { label: 'Gold price per gram', short: 'Price per gram', group: 'gold', min: 100, max: 1_000_000 },
  // Gold making charge: a flat amount in rupees per piece, set for each gold product.
  ...Object.fromEntries(
    goldProducts.map((p) => [
      makingKey(p.id),
      { label: `${p.name} making charge`, short: p.name, group: 'goldMaking', min: 0, max: 1_000_000, flat: true, productId: p.id, grams: p.grams ?? null, tola: p.tola ?? null },
    ]),
  ),
  silverPerTola: { label: 'Silver price per tola', short: 'Price per tola', group: 'silver', min: 10, max: 1_000_000 },
  silverPerGram: { label: 'Silver price per gram', short: 'Price per gram', group: 'silver', min: 1, max: 100_000 },
  ...Object.fromEntries(
    silverProducts.map((p) => [
      makingKey(p.id),
      { label: `${p.name} making charge`, short: p.name, group: 'making', min: 0, max: 50, percent: true, productId: p.id, grams: p.grams },
    ]),
  ),
};

export const SKILL_FEE = { rate: 0.005, label: 'Skill promotion fee', appliesTo: 'personal' };
const KEYS = Object.keys(RATE_FIELDS);

// Rounds half up to the paisa; toPrecision removes float noise such as 4172.775 → 4172.7749999…
const round2 = (n) => Math.round(Number((n * 100).toPrecision(12))) / 100;
const EMPTY = Object.fromEntries([...KEYS, 'updatedAt', 'by'].map((k) => [k, null]));

function store(env) {
  if (!env.QUOTE_RATES) throw new Error('QUOTE_RATES KV binding is missing.');
  return env.QUOTE_RATES;
}

const normalise = (r) => ({ ...EMPTY, ...Object.fromEntries(Object.entries(r ?? {}).filter(([k]) => k in EMPTY)) });

export async function getRates(env) {
  return normalise(await store(env).get('current', 'json'));
}

export async function getHistory(env) {
  return ((await store(env).get('history', 'json')) ?? []).map(normalise);
}

// `by` is the staff email Cloudflare Access verified, when Access is set up.
export async function saveRates(env, values, by = null) {
  const kv = store(env);
  const current = { ...values, updatedAt: new Date().toISOString(), by };
  const history = [current, ...(await getHistory(env))].slice(0, 50);
  await kv.put('current', JSON.stringify(current));
  await kv.put('history', JSON.stringify(history));
  return current;
}

export const metalOfField = (field) => (field.group === 'gold' || field.group === 'goldMaking' ? 'gold' : 'silver');

// Rates for an out-of-stock metal are hidden on the admin page, so they are kept as they were.
export function parseRates(body, current = {}, stock = { gold: true, silver: true }) {
  const values = {};
  const errors = {};
  const fmt = (n) => n.toLocaleString('en-IN');
  for (const [key, field] of Object.entries(RATE_FIELDS)) {
    const { label, min, max, percent } = field;
    if (stock[metalOfField(field)] === false) {
      values[key] = current[key] ?? null;
      continue;
    }
    const raw = String(body?.[key] ?? '').replace(/,/g, '').replace(/%$/, '').trim();
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n < min || n > max) {
      errors[key] = percent
        ? `${label} must be between ${min}% and ${max}%.`
        : `${label} must be between Rs. ${fmt(min)} and Rs. ${fmt(max)}.`;
    } else values[key] = round2(n);
  }
  return { values, errors };
}

function rateFor(metal, product, rates) {
  if (metal.id === 'gold') return product.tola ? ['goldPerTola', rates.goldPerTola] : ['goldPerGram', rates.goldPerGram];
  return product.tola ? ['silverPerTola', rates.silverPerTola] : ['silverPerGram', rates.silverPerGram];
}

export function priceItems(items, rates, customerType) {
  const missing = new Set();

  const lines = items.map((item) => {
    const metal = catalog.metals.find((m) => m.id === item.metal);
    const product = metal.products.find((p) => p.id === item.product);
    const [rateKey, rate] = rateFor(metal, product, rates);
    if (rate == null) missing.add(rateKey);
    const unitPrice = rate == null ? null : round2(product.tola ? rate * product.tola : rate * product.grams);
    const total = unitPrice == null ? null : round2(unitPrice * item.quantity);
    // silver: a percentage of the line's value; gold: a flat amount per piece
    let makingPercent = null;
    let makingFlat = null;
    const mk = rates[makingKey(product.id)];
    if (mk == null) missing.add(makingKey(product.id));
    else if (metal.id === 'silver') makingPercent = mk;
    else makingFlat = mk;
    return { ...item, rateKey, rate, unitPrice, total, makingPercent, makingFlat };
  });

  if (missing.size) {
    return { lines, metalTotal: null, making: null, skillFee: null, total: null, missing: [...missing].map((k) => RATE_FIELDS[k].label) };
  }

  const metalTotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const byProduct = new Map();
  for (const l of lines.filter((x) => x.makingPercent != null || x.makingFlat != null)) {
    const g = byProduct.get(l.product) ?? {
      product: l.product, productName: l.productName, metal: l.metal, metalName: l.metalName,
      percent: l.makingPercent, flat: l.makingFlat, base: 0, quantity: 0,
    };
    g.base = round2(g.base + l.total);
    g.quantity += l.quantity;
    byProduct.set(l.product, g);
  }
  const makingLines = [...byProduct.values()]
    .map((g) => ({ ...g, amount: g.flat != null ? round2(g.flat * g.quantity) : round2((g.base * g.percent) / 100) }))
    .filter((g) => g.amount > 0);
  const making = makingLines.length ? { lines: makingLines, amount: round2(makingLines.reduce((s, g) => s + g.amount, 0)) } : null;
  const beforeFee = round2(metalTotal + (making?.amount ?? 0));
  const skillFee = customerType === SKILL_FEE.appliesTo
    ? { label: SKILL_FEE.label, percent: SKILL_FEE.rate * 100, base: beforeFee, amount: round2(beforeFee * SKILL_FEE.rate) }
    : null;
  return { lines, metalTotal, making, skillFee, total: round2(beforeFee + (skillFee?.amount ?? 0)), missing: [] };
}
