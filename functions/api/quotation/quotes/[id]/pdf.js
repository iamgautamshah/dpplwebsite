import { fileSafe, loadQuote } from '../../../../../server/quotation/quotes.js';
import { quotePdf } from '../../../../../server/quotation/pdf.js';

export async function onRequestGet({ params, env }) {
  const quote = await loadQuote(env, params.id);
  if (!quote) return new Response('Quotation not found.', { status: 404, headers: { 'content-type': 'text/plain' } });
  const bytes = await quotePdf(quote);
  return new Response(bytes, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="Quotation-${fileSafe(quote.number)}.pdf"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
