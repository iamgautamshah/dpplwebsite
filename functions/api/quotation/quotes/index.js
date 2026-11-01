import { json, validateCustomer, validateItems } from '../../../../server/quotation/validate.js';
import { getRates, priceItems, publicRates } from '../../../../server/quotation/rates.js';
import { getLiveRates } from '../../../../server/quotation/live.js';
import { newIds, rateLimited, saveQuote, whatsappUrl } from '../../../../server/quotation/quotes.js';
import { CLOSED_MESSAGE, getStock } from '../../../../server/quotation/stock.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ ok: false, message: 'Unsupported request.' }, 415);
  const body = await request.json().catch(() => ({}));

  const stock = await getStock(env);
  if (!stock.open) return json({ ok: false, closed: true, message: CLOSED_MESSAGE }, 503);
  const { customer, errors: customerErrors } = validateCustomer(body.customer);
  if (!customer) return json({ ok: false, step: 'customer', errors: customerErrors, message: 'Please check your customer details.' }, 422);
  const { items, errors: itemErrors } = validateItems(body.items, customer.customerType, stock);
  if (Object.keys(itemErrors).length) return json({ ok: false, step: 'products', errors: itemErrors, message: 'Please check your products.' }, 422);

  try {
    if (await rateLimited(env, request, 'quote', 20, 3600)) {
      return json({ ok: false, message: 'Too many quotation requests. Please try again later or call us.' }, 429);
    }
    const [makingRates, live] = await Promise.all([getRates(env), getLiveRates(context)]);
    const { lines, metalTotal, making, skillFee, total, missing } = priceItems(items, makingRates, live, customer.customerType);
    if (missing.length) return json({ ok: false, message: 'Today’s price isn’t available yet. Please try again later or call us on 01-5915052.' }, 409);

    const createdAt = new Date().toISOString();
    const { id, number } = await newIds(env);
    const quote = { id, number, createdAt, customer, items, rates: publicRates(live), price: { lines, metalTotal, making, skillFee, total } };
    await saveQuote(env, quote);

    const origin = new URL(request.url).origin;
    return json({
      ok: true,
      id,
      number,
      createdAt,
      price: quote.price,
      pdfUrl: `/api/quotation/quotes/${id}/pdf`,
      whatsappUrl: whatsappUrl(quote, origin),
    });
  } catch (err) {
    console.error('Saving quote failed:', err.message);
    return json({ ok: false, message: 'Couldn’t save your quotation. Please try again.' }, 503);
  }
}
