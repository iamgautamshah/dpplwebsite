import { allowedFor, displayName, findProduct, json, validateItems } from '../../../server/quotation/validate.js';
import { RATE_FIELDS, getRates, makingSetting, priceItems, publicRates, unitPrice, unitWord } from '../../../server/quotation/rates.js';
import { getLiveRates } from '../../../server/quotation/live.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

// Making charges shown on the Price page: each product's % and the amount per
// bar/piece at today's rate (or the fixed amount, when set that way).
function makingRates(making, live, customerType) {
  return Object.entries(RATE_FIELDS)
    .map(([key, f]) => ({ key, f, ...findProduct(f.metal, f.productId) }))
    .filter(({ product }) => allowedFor(product, customerType))
    .map(({ key, f, metal, product }) => {
      const setting = makingSetting(making, key);
      const unit = unitPrice(product, live?.[f.metal]);
      let percent = null;
      let perUnit = null;
      if (setting?.basis === 'flat') {
        perUnit = setting.perUnit;
        percent = unit ? Math.round((setting.perUnit / unit) * 10000) / 100 : null;
      } else if (setting) {
        percent = setting.percent;
        perUnit = unit == null ? null : Math.round(unit * setting.percent) / 100;
      }
      return { metal: f.metal, product: f.productId, name: displayName(metal, product), basis: setting?.basis ?? null, percent, perUnit, unit: unitWord(f.metal, product) };
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
