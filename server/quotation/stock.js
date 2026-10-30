export const CLOSED_MESSAGE =
  'Sorry for the inconvenience, but we are currently out of stock and not taking quotation requests. Thank you for your patience. Please check back soon.';

const DEFAULT = { gold: true, silver: true, updatedAt: null };

function kv(env) {
  if (!env.QUOTE_RATES) throw new Error('QUOTE_RATES KV binding is missing.');
  return env.QUOTE_RATES;
}

export async function getStock(env) {
  const s = { ...DEFAULT, ...((await kv(env).get('stock', 'json')) ?? {}) };
  return { ...s, open: s.gold || s.silver };
}

export async function saveStock(env, { gold, silver }) {
  const s = { gold: !!gold, silver: !!silver, updatedAt: new Date().toISOString() };
  await kv(env).put('stock', JSON.stringify(s));
  return { ...s, open: s.gold || s.silver };
}

export const outOfStockMessage = (metalName) => `Sorry, ${metalName.toLowerCase()} is currently out of stock.`;
