import { json } from '../../../server/quotation/validate.js';
import { RATE_FIELDS, getHistory, getRates, parseRates, publicRates, saveRates } from '../../../server/quotation/rates.js';
import { getLiveRates } from '../../../server/quotation/live.js';
import { getStock } from '../../../server/quotation/stock.js';

// Today's metal rates come from the website; staff save only making charges.
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const [current, history, live] = await Promise.all([getRates(env), getHistory(env), getLiveRates(context)]);
    return json({ current, history, fields: RATE_FIELDS, live: publicRates(live) });
  } catch (err) {
    console.error('Admin rates read failed:', err.message);
    return json({ message: 'Couldn’t load rates. Please try again.' }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, data } = context;
  const body = await request.json().catch(() => ({}));
  try {
    const [previous, stock] = await Promise.all([getRates(env), getStock(env)]);
    const { values, errors } = parseRates(body, previous, stock);
    if (Object.keys(errors).length) return json({ ok: false, errors }, 422);
    const current = await saveRates(env, values, data?.accessEmail ?? null);
    const live = await getLiveRates(context);
    return json({ ok: true, current, history: await getHistory(env), live: publicRates(live) });
  } catch (err) {
    console.error('Admin rates save failed:', err.message);
    return json({ ok: false, message: 'Couldn’t save making charges. Please try again.' }, 500);
  }
}
