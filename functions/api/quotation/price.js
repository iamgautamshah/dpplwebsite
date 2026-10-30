import { allowedFor, findProduct, json, validateItems } from '../../../server/quotation/validate.js';
import { RATE_FIELDS, getRates, priceItems } from '../../../server/quotation/rates.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

function makingRates(rates, customerType) {
  return Object.entries(RATE_FIELDS)
    .filter(([, f]) => f.group === 'making')
    .filter(([, f]) => allowedFor(findProduct('silver', f.productId).product, customerType))
    .map(([key, f]) => ({ product: f.productId, name: f.short, percent: rates[key] }));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const stock = await getStock(env);
  if (!stock.open) return json({ ok: false, closed: true, message: CLOSED_MESSAGE }, 503);
  const { items, errors } = validateItems(body.items, body.customerType, stock);
  if (Object.keys(errors).length) {
    return json({ ok: false, errors, message: Object.values(errors)[0] }, 422);
  }

  try {
    const rates = await getRates(env);
    return json({
      ok: true,
      rates,
      makingRates: makingRates(rates, body.customerType),
      ...priceItems(items, rates, body.customerType),
      calculatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Pricing failed:', err.message);
    return json({ ok: false, message: 'Prices are temporarily unavailable. Please try again shortly.' }, 503);
  }
}
