import { allowedFor, displayName, json, validateItems } from '../../../server/quotation/validate.js';
import catalog from '../../../public/quotation/data/products.json';
import { getRates, priceItems, publicRates, settingFor, unitPrice, unitWord } from '../../../server/quotation/rates.js';
import { getLiveRates } from '../../../server/quotation/live.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

// Making charges shown on the Price page: each product's % and the amount per
// bar/piece at today's rate (or the fixed amount, when set that way).
function makingRates(making, live, customerType) {
  return catalog.metals.flatMap((metal) => metal.products
    .filter((product) => allowedFor(product, customerType))
    .map((product) => {
      const setting = settingFor(making, metal.id, product.id, customerType);
      const unit = unitPrice(product, live?.[metal.id]);
      let percent = null;
      let perUnit = null;
      if (setting?.basis === 'flat') {
        perUnit = setting.perUnit;
        percent = unit ? Math.round((setting.perUnit / unit) * 10000) / 100 : null;
      } else if (setting) {
        percent = setting.percent;
        perUnit = unit == null ? null : Math.round(unit * setting.percent) / 100;
      }
      return { metal: metal.id, product: product.id, name: displayName(metal, product), basis: setting?.basis ?? null, percent, perUnit, unit: unitWord(metal.id, product) };
    }));
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
