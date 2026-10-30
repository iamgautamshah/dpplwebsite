import { json, validateItems } from '../../../server/quotation/validate.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const stock = await getStock(env);
  if (!stock.open) return json({ ok: false, closed: true, message: CLOSED_MESSAGE }, 503);
  const { items, errors } = validateItems(body.items, body.customerType, stock);
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);
  return json({ ok: true, items });
}
