import company from '../../public/quotation/data/company.json';
import { money, nepalDateCode } from './format.js';

export const ID_RE = /^[a-f0-9]{32}$/;
const KEEP_DAYS = 180;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function kv(env) {
  if (!env.QUOTES) throw new Error('QUOTES KV binding is missing.');
  return env.QUOTES;
}

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export function newIds(createdAt) {
  const id = hex(crypto.getRandomValues(new Uint8Array(16)));
  const code = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  return { id, number: `${company.shortName}-${nepalDateCode(createdAt)}-${code}` };
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
