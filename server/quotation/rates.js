import catalog from '../../public/quotation/data/products.json';

/* Quotation pricing.

   Metal rates are not typed in: they are the same 1 tola and 10 gram selling
   rates the website publishes each morning (see live.js). Staff set only the
   making charge for each product, as a % of the metal value or as a flat
   rupee amount per bar/piece (per gram for grains); admin shows both, linked.

   - A product weighed in tola is priced from the tola rate; one in grams from
     the 10 gram rate (unit price = 10 g rate × grams ÷ 10). This is how the
     associations publish the two figures and how the counter prices.
   - Making charge = % × line amount, or flat amount × quantity.
   - Personal customers only: skill promotion fee on (subtotal + making).
   - Amounts round half up to the paisa. */

const metal = (id) => catalog.metals.find((m) => m.id === id);
export const GRAMS_PER_TOLA = 11.6638;

// Gold making keys end in _pct: before this change gold making charges were
// stored as flat rupee amounts under making_gold_*, and an old 1000 must never
// be read as 1000%.
// Personal and business customers each have their own making charge per
// product. The personal key is the original one; business adds `_biz`. Until a
// business charge is saved, business customers are charged the personal one.
export const CUSTOMERS = ['personal', 'business'];
const CUSTOMER_NAME = { personal: 'Personal', business: 'Business' };
export const makingKey = (metalId, productId, customer = 'personal') =>
  `making_${productId.replace(/-/g, '_')}${metalId === 'gold' ? '_pct' : ''}${customer === 'business' ? '_biz' : ''}`;

const offeredTo = (p, customer) => !p.customerTypes || p.customerTypes.includes(customer);

export const RATE_FIELDS = Object.fromEntries(
  catalog.metals.flatMap((m) => m.products.flatMap((p) => CUSTOMERS.filter((c) => offeredTo(p, c)).map((c) => [
    makingKey(m.id, p.id, c),
    {
      label: `${p.name} making charge (${CUSTOMER_NAME[c]})`,
      short: p.name,
      customer: c,
      group: m.id === 'gold' ? 'goldMaking' : 'making',
      metal: m.id,
      min: 0,
      max: 50,
      percent: true,
      productId: p.id,
      grams: p.grams ?? null,
      tola: p.tola ?? null,
      unit: p.unit,
    },
  ]))),
);

// Personal keys of business-only products (Silver Grains). Their charge was
// saved before charges were split by customer type; it is kept and used for
// business customers until a business charge is saved.
const LEGACY_KEYS = catalog.metals.flatMap((m) => m.products.filter((p) => !offeredTo(p, 'personal')).map((p) => makingKey(m.id, p.id, 'personal')));

export const SKILL_FEE = { rate: 0.005, label: 'Skill promotion fee', appliesTo: 'personal' };
const KEYS = Object.keys(RATE_FIELDS);

// Rounds half up to the paisa; toPrecision removes float noise such as 4172.775 → 4172.7749999…
export const round2 = (n) => Math.round(Number((n * 100).toPrecision(12))) / 100;
const round4 = (n) => Math.round(Number((n * 10000).toPrecision(12))) / 10000;
// For each product: its % (KEYS), and — when staff set a flat amount per bar or
// piece — `basis[key] = 'flat'` with the amount in `perUnit[key]`. Whichever box
// the staff typed in last is kept, so a flat charge stays fixed when the rate moves.
const EMPTY = Object.fromEntries([...KEYS, ...LEGACY_KEYS, 'basis', 'perUnit', 'updatedAt', 'by'].map((k) => [k, null]));
export const MAX_PER_UNIT = 10_000_000;

/** What one unit of a product is called: bar, piece, or gram (grains). */
export const unitWord = (metalId, product) =>
  product.unit === 'gram' ? 'gram' : metalId === 'gold' || /bar/i.test(product.name) ? 'bar' : 'piece';

function store(env) {
  if (!env.QUOTE_RATES) throw new Error('QUOTE_RATES KV binding is missing.');
  return env.QUOTE_RATES;
}

const normalise = (r) => ({ ...EMPTY, ...Object.fromEntries(Object.entries(r ?? {}).filter(([k]) => k in EMPTY)) });

/** The saved making-charge percentages. */
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

export const metalOfField = (field) => field.metal;

const number = (v) => {
  const raw = String(v ?? '').replace(/,/g, '').replace(/%$/, '').trim();
  return raw === '' ? NaN : Number(raw);
};

/* Body, for each product key: `${key}` (%), `${key}__perUnit` (flat Rs per bar/piece) and
   `${key}__basis` ('pct' or 'flat' — the one the staff typed last).
   Making charges for an out-of-stock metal are hidden on the admin page, so
   they are kept as they were. */
export function parseRates(body, current = {}, stock = { gold: true, silver: true }) {
  const values = { basis: {}, perUnit: {} };
  const errors = {};
  for (const [key, field] of Object.entries(RATE_FIELDS)) {
    const { label, min, max } = field;
    const sent = [key, `${key}__basis`, `${key}__perUnit`].some((k) => body?.[k] != null);
    // metal switched off, or a business charge an older admin page didn't send: keep as it was
    if (stock[field.metal] === false || (field.customer === 'business' && !sent)) {
      values[key] = current[key] ?? null;
      if (current.basis?.[key]) values.basis[key] = current.basis[key];
      if (current.perUnit?.[key] != null) values.perUnit[key] = current.perUnit[key];
      continue;
    }
    if (body?.[`${key}__basis`] === 'flat') {
      const g = number(body[`${key}__perUnit`]);
      if (!Number.isFinite(g) || g < 0 || g > MAX_PER_UNIT) {
        errors[key] = `${label} must be between Rs. 0 and Rs. ${MAX_PER_UNIT.toLocaleString('en-IN')}.`;
        continue;
      }
      values.basis[key] = 'flat';
      values.perUnit[key] = round2(g);
      // the % at the time of saving, for reference only; the flat amount is what is charged
      const n = number(body[key]);
      values[key] = Number.isFinite(n) && n >= 0 ? round4(n) : null;
    } else {
      const n = number(body?.[key]);
      if (!Number.isFinite(n) || n < min || n > max) {
        errors[key] = `${label} must be between ${min}% and ${max}%.`;
        continue;
      }
      values.basis[key] = 'pct';
      values[key] = round4(n);
    }
  }
  for (const key of LEGACY_KEYS) {
    const n = number(body?.[key]);
    values[key] = Number.isFinite(n) && n >= 0 && n <= 50 ? round4(n) : current[key] ?? null;
    if (current.basis?.[key] && values[key] === current[key]) values.basis[key] = current.basis[key];
    if (current.perUnit?.[key] != null && values[key] === current[key]) values.perUnit[key] = current.perUnit[key];
  }
  return { values, errors };
}

/** A product's making charge for a customer type, with the business → personal fallback. */
export function settingFor(making, metalId, productId, customer) {
  const own = makingSetting(making, makingKey(metalId, productId, customer));
  if (own || customer !== 'business') return own;
  return makingSetting(making, makingKey(metalId, productId, 'personal'));
}

/** How a product's making charge is set: { basis: 'pct'|'flat', percent, perUnit }. */
export function makingSetting(making, key) {
  if (making.basis?.[key] === 'flat' && making.perUnit?.[key] != null) {
    return { basis: 'flat', percent: making[key] ?? null, perUnit: making.perUnit[key] };
  }
  return making[key] == null ? null : { basis: 'pct', percent: making[key], perUnit: null };
}

/** Price of one piece (or one gram, for products sold by the gram) at today's rate. */
export function unitPrice(product, rate) {
  if (!rate) return null;
  if (product.tola) return round2(rate.tola * product.tola);
  return round2((rate.g10 * product.grams) / 10);
}

const RATE_LABEL = { gold: 'Today’s gold rate', silver: 'Today’s silver rate' };

/**
 * @param items  validated items
 * @param making saved making-charge percentages (getRates)
 * @param live   today's published rates (live.js), or null
 */
export function priceItems(items, making, live, customerType) {
  const missing = new Set();

  const lines = items.map((item) => {
    const m = metal(item.metal);
    const product = m.products.find((p) => p.id === item.product);
    const rate = live?.[m.id] ?? null;
    if (!rate) missing.add(RATE_LABEL[m.id]);
    const unit = unitPrice(product, rate);
    const total = unit == null ? null : round2(unit * item.quantity);
    const key = makingKey(m.id, product.id, customerType === 'business' ? 'business' : 'personal');
    const setting = settingFor(making, m.id, product.id, customerType);
    if (!setting) missing.add(RATE_FIELDS[key]?.label ?? `${product.name} making charge`);
    // weight follows from the quantity; the rate is the published one it is priced from
    const weightTola = product.tola ? product.tola * item.quantity : null;
    const weightGrams = product.tola ? Math.round(product.tola * GRAMS_PER_TOLA * item.quantity * 1000) / 1000 : product.grams * item.quantity;
    const rateUnit = product.tola ? 'tola' : '10 g';
    const rateValue = rate ? (product.tola ? rate.tola : rate.g10) : null;
    return { ...item, unitPrice: unit, total, makingSetting: setting, weightGrams, weightTola, rateUnit, rateValue };
  });

  if (missing.size) {
    return { lines, metalTotal: null, making: null, skillFee: null, total: null, missing: [...missing] };
  }

  const metalTotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const byProduct = new Map();
  for (const l of lines) {
    const g = byProduct.get(l.product) ?? { product: l.product, productName: l.productName, metal: l.metal, metalName: l.metalName, setting: l.makingSetting, base: 0, quantity: 0, grams: 0 };
    g.base = round2(g.base + l.total);
    g.quantity += l.quantity;
    g.grams += l.weightGrams;
    byProduct.set(l.product, g);
  }
  // % of the line value, or a flat amount per bar/piece (per gram for grains)
  const makingLines = [...byProduct.values()]
    .map(({ setting, ...g }) => {
      const amount = setting.basis === 'flat' ? round2(setting.perUnit * g.quantity) : round2((g.base * setting.percent) / 100);
      return {
        ...g,
        basis: setting.basis,
        amount,
        percent: setting.basis === 'flat' ? (g.base ? round2((amount / g.base) * 100) : 0) : setting.percent,
        perUnit: setting.basis === 'flat' ? setting.perUnit : (g.quantity ? round2(amount / g.quantity) : 0),
      };
    })
    .filter((g) => g.amount > 0);
  const makingTotal = makingLines.length ? { lines: makingLines, amount: round2(makingLines.reduce((s, g) => s + g.amount, 0)) } : null;
  const beforeFee = round2(metalTotal + (makingTotal?.amount ?? 0));
  const skillFee = customerType === SKILL_FEE.appliesTo
    ? { label: SKILL_FEE.label, percent: SKILL_FEE.rate * 100, base: beforeFee, amount: round2(beforeFee * SKILL_FEE.rate) }
    : null;
  return { lines, metalTotal, making: makingTotal, skillFee, total: round2(beforeFee + (skillFee?.amount ?? 0)), missing: [] };
}

/** Today's rates in the shape the pages show them. */
export function publicRates(live) {
  return {
    date: live?.date ?? null,
    source: live?.source ?? null,
    goldPerTola: live?.gold?.tola ?? null,
    goldPer10g: live?.gold?.g10 ?? null,
    silverPerTola: live?.silver?.tola ?? null,
    silverPer10g: live?.silver?.g10 ?? null,
  };
}
