import { allowedFor, displayName, findProduct, json, validateItems } from '../../../server/quotation/validate.js';
import { RATE_FIELDS, getRates, priceItems, publicRates, unitPrice } from '../../../server/quotation/rates.js';
import { getLiveRates } from '../../../server/quotation/live.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

// Making charges shown on the Price page: each product's % and what it comes
// to per piece (or per gram, for grains) at today's rate.
function makingRates(making, live, customerType) {
  return Object.entries(RATE_FIELDS)
    .map(([key, f]) => ({ key, f, ...findProduct(f.metal, f.productId) }))
    .filter(({ product }) => allowedFor(product, customerType))
    .map(({ key, f, metal, product }) => {
      const pct = making[key];
      const unit = unitPrice(product, live?.[f.metal]);
      return {
        metal: f.metal,
        product: f.productId,
        name: displayName(metal, product),
        percent: pct,
        perUnit: pct == null || unit == null ? null : Math.round(unit * pct) / 100,
        unit: product.unit,
      };
    });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const stock = await getStock(env);
  if (!stock.open) return json({ ok: false, closed: true, message: CLOSED_MESSAGE }, 503);
  const { items, errors } = validateItems(body.items, body.customerType, stock);
  if (Object.keys(errors).length) {
    return json({ ok: false, errors, message: Object.values(errors)[0] }, 422);
  }

  try {
    const [making, live] = await Promise.all([getRates(env), getLiveRates(context)]);
    return json({
      ok: true,
      rates: publicRates(live),
      makingRates: makingRates(making, live, body.customerType),
      ...priceItems(items, making, live, body.customerType),
      calculatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Pricing failed:', err.message);
    return json({ ok: false, message: 'Prices are temporarily unavailable. Please try again shortly.' }, 503);
  }
}
