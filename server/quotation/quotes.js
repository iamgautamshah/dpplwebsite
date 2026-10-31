import company from '../../public/quotation/data/company.json';
import { money, nepalDate8 } from './format.js';

export const ID_RE = /^[a-f0-9]{32}$/;
const KEEP_DAYS = 180;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function kv(env) {
  if (!env.QUOTES) throw new Error('QUOTES KV binding is missing.');
  return env.QUOTES;
}

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/* Quotation number: DPPL and the Nepal date, e.g. DPPL/20261031. The day's
   gold and silver prices are printed beneath it on the quotation. */
export function quoteNumber(createdAt, live) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(live?.date || '') ? live.date.replace(/-/g, '') : nepalDate8(createdAt);
  return `${company.shortName}/${date}`;
}

// "/" cannot appear in a file name
export const fileSafe = (number) => String(number).replace(/[\\/]/g, '-');

export function newIds(createdAt, live) {
  const id = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { id, number: quoteNumber(createdAt, live) };
}

export async function saveQuote(env, quote) {
  await kv(env).put(`quote:${quote.id}`, JSON.stringify(quote), { expirationTtl: KEEP_DAYS * 86400 });
}

export async function loadQuote(env, id) {
  if (!ID_RE.test(id ?? '')) return null;
  return kv(env).get(`quote:${id}`, 'json');
}

export async function rateLimited(env, request, bucket, limit, windowSeconds) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const key = `rl:${bucket}:${ip}`;
  const count = Number((await kv(env).get(key)) ?? 0);
  if (count >= limit) return true;
  await kv(env).put(key, String(count + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return false;
}

export function whatsappUrl(quote, origin) {
  const c = quote.customer;
  const lines = [
    `Quotation request ${quote.number}`,
    `${c.customerType === 'business' ? 'Business' : 'Name'}: ${c.name}`,
    ...(c.contactPerson ? [`Contact person: ${c.contactPerson}`] : []),
    `Phone: ${c.phone}`,
    `Total: ${money(quote.price.total)}`,
    '',
    `PDF: ${origin}/api/quotation/quotes/${quote.id}/pdf`,
  ];
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
