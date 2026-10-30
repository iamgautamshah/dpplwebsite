import { json } from '../../../server/quotation/validate.js';
import { getStock, saveStock } from '../../../server/quotation/stock.js';

export async function onRequestGet({ env }) {
  return json(await getStock(env));
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.gold !== 'boolean' || typeof body.silver !== 'boolean') {
    return json({ ok: false, message: 'Send gold and silver as true or false.' }, 422);
  }
  return json({ ok: true, ...(await saveStock(env, body)) });
}
