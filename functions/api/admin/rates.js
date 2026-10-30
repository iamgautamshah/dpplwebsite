import { json } from '../../../server/quotation/validate.js';
import { RATE_FIELDS, getHistory, getRates, parseRates, saveRates } from '../../../server/quotation/rates.js';
import { getStock } from '../../../server/quotation/stock.js';

export async function onRequestGet({ env }) {
  try {
    const [current, history] = await Promise.all([getRates(env), getHistory(env)]);
    return json({ current, history, fields: RATE_FIELDS });
  } catch (err) {
    console.error('Admin rates read failed:', err.message);
    return json({ message: 'Couldn’t load rates. Please try again.' }, 500);
  }
}

export async function onRequestPut({ request, env, data }) {
  const body = await request.json().catch(() => ({}));
  try {
    const [previous, stock] = await Promise.all([getRates(env), getStock(env)]);
    const { values, errors } = parseRates(body, previous, stock);
    if (Object.keys(errors).length) return json({ ok: false, errors }, 422);
    const current = await saveRates(env, values, data?.accessEmail ?? null);
    return json({ ok: true, current, history: await getHistory(env) });
  } catch (err) {
    console.error('Admin rates save failed:', err.message);
    return json({ ok: false, message: 'Couldn’t save rates. Please try again.' }, 500);
  }
}
