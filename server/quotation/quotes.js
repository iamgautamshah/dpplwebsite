import company from '../../public/quotation/data/company.json';
import { money } from './format.js';

export const ID_RE = /^[a-f0-9]{32}$/;
const KEEP_DAYS = 180;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function kv(env) {
  if (!env.QUOTES) throw new Error('QUOTES KV binding is missing.');
  return env.QUOTES;
}

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/* Quotation numbers: one running count that never restarts — DPPL/01,
   DPPL/02 … DPPL/99, DPPL/100 …

   With a D1 database bound as QUOTE_DB, the next number comes from a single
   atomic UPDATE … RETURNING, so two quotations can never share one. Without
   it, the count is kept in QUOTES and each number is claimed and read back
   before use, retrying on a clash; that is unique in practice, and D1 makes
   it a guarantee. When D1 is added later it carries on from the QUOTES count. */
export const quoteNumber = (serial) => `${company.shortName}/${String(serial).padStart(2, '0')}`;

const COUNTER_KEY = 'seq:quote';

async function kvCount(env) {
  return Number(await kv(env).get(COUNTER_KEY)) || 0;
}

async function d1Serial(db, seed) {
  const [, , res] = await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL)'),
    db.prepare("INSERT OR IGNORE INTO counters (name, value) VALUES ('quote', ?)").bind(seed),
    db.prepare("UPDATE counters SET value = value + 1 WHERE name = 'quote' RETURNING value"),
  ]);
  const n = res?.results?.[0]?.value;
  if (!Number.isInteger(n)) throw new Error('D1 counter returned no value');
  return n;
}

async function kvSerial(env) {
  const store = kv(env);
  const token = hex(crypto.getRandomValues(new Uint8Array(8)));
  for (let attempt = 0; attempt < 8; attempt++) {
    const n = (await kvCount(env)) + 1;
    const claim = `seq:claim:${n}`;
    if (await store.get(claim)) {
      await store.put(COUNTER_KEY, String(n)); // someone has it; move the count past it
      continue;
    }
    await store.put(claim, token, { expirationTtl: (KEEP_DAYS + 30) * 86400 });
    await store.put(COUNTER_KEY, String(n));
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
    if ((await store.get(claim)) === token) return n;
  }
  throw new Error('Could not reserve a quotation number');
}

async function nextSerial(env) {
  if (env.QUOTE_DB) {
    const seed = await kvCount(env);
    const n = await d1Serial(env.QUOTE_DB, seed);
    await kv(env).put(COUNTER_KEY, String(n)); // keep the fallback count in step
    return n;
  }
  return kvSerial(env);
}

// "/" cannot appear in a file name
export const fileSafe = (number) => String(number).replace(/[\\/]/g, '-');

export async function newIds(env) {
  const id = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { id, number: quoteNumber(await nextSerial(env)) };
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
