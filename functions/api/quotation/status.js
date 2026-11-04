import { json } from '../../../server/quotation/validate.js';
import { CLOSED_MESSAGE, getStock, publicStock } from '../../../server/quotation/stock.js';

export async function onRequestGet({ env }) {
  try {
    const s = publicStock(await getStock(env));
    return json({ ...s, message: s.open ? null : CLOSED_MESSAGE });
  } catch (err) {
    console.error('Status read failed:', err.message);
    return json({ gold: true, silver: true, out: [], open: true, message: null });
  }
}
