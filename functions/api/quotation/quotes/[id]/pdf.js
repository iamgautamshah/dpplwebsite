import { fileSafe, loadQuote } from '../../../../../server/quotation/quotes.js';
import { quotePdf } from '../../../../../server/quotation/pdf.js';
import { getLiveRates } from '../../../../../server/quotation/live.js';
import { publicRates } from '../../../../../server/quotation/rates.js';

const nepalDay = (d) => new Date(new Date(d).getTime() + 345 * 60000).toISOString().slice(0, 10);
const complete = (r) => r && ['goldPerTola', 'goldPer10g', 'silverPerTola', 'silverPer10g'].every((k) => Number(r[k]) > 0);

export async function onRequestGet(context) {
  const { params, env } = context;
  const quote = await loadQuote(env, params.id);
  if (!quote) return new Response('Quotation not found.', { status: 404, headers: { 'content-type': 'text/plain' } });
  // A quotation made today with rates missing from its record can borrow
  // today's published rates for the header table; an older one never does.
  let today = null;
  if (!complete(quote.rates) && nepalDay(quote.createdAt) === nepalDay(Date.now())) {
    const live = await getLiveRates(context);
    if (live?.date === nepalDay(quote.createdAt)) today = publicRates(live);
  }
  const bytes = await quotePdf(quote, today);
  return new Response(bytes, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="Quotation-${fileSafe(quote.number)}.pdf"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
      'x-dppl-pdf-layout': 'rates-table',
    },
  });
}
