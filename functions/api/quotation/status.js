import { json } from '../../../server/quotation/validate.js';
import { CLOSED_MESSAGE, getStock } from '../../../server/quotation/stock.js';

export async function onRequestGet({ env }) {
  try {
    const { gold, silver, open } = await getStock(env);
    return json({ gold, silver, open, message: open ? null : CLOSED_MESSAGE });
  } catch (err) {
    console.error('Status read failed:', err.message);
    return json({ gold: true, silver: true, open: true, message: null });
  }
}
