import { json, validateCustomer } from '../../../server/quotation/validate.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

export async function onRequestPost({ request, env }) {
  if (!(await getStock(env)).open) return json({ ok: false, closed: true, message: CLOSED_MESSAGE }, 503);
  const body = await request.json().catch(() => ({}));
  const { customer, errors } = validateCustomer(body);
  if (!customer) return json({ ok: false, errors }, 422);
  return json({ ok: true, customer });
}
