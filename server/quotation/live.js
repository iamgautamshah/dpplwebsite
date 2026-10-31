import { onRequestGet as ratesFunction } from '../../functions/api/silver.js';

/* Today's selling rates, exactly as the website publishes them.

   The quotation calls the same function that answers /api/silver (and fills
   the homepage rate board) directly, rather than over the network, so it
   gets the same figure, the same edge cache and the same rule: only today's
   rate is ever used. If nothing has been published today, or both sources
   are down, the result is null and the quotation says the price isn't
   available yet. */

const usable = (n) => Number.isFinite(n) && n > 0;

export async function getLiveRates(context) {
  try {
    const url = new URL('/api/silver', context.request.url);
    const res = await ratesFunction({
      request: new Request(url.toString(), { headers: { accept: 'application/json' } }),
      env: context.env,
      waitUntil: (p) => (context.waitUntil ? context.waitUntil(p) : p),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const silver = usable(d.tolaSale) && usable(d.g10Sale) ? { tola: d.tolaSale, g10: d.g10Sale } : null;
    const gold = d.gold && usable(d.gold.tolaSale) && usable(d.gold.g10Sale) ? { tola: d.gold.tolaSale, g10: d.gold.g10Sale } : null;
    if (!silver && !gold) return null;
    return { date: d.dateAD, source: d.source, gold, silver };
  } catch (err) {
    console.error('[quotation] live rate unavailable:', err.message);
    return null;
  }
}
