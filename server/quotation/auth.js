/* Staff sign-in for the quotation admin.

   - The password lives only in the encrypted Cloudflare secret ADMIN_PASSWORD.
     It is never stored, logged or sent to the browser.
   - A session is a cookie of the form  <expiry>.<session id>.<signature>.
     The signature is an HMAC (SESSION_SECRET) over the expiry, the id and a
     fingerprint of the current password, so:
       · the cookie cannot be forged or extended,
       · changing ADMIN_PASSWORD signs every device out,
       · rotating SESSION_SECRET signs every device out.
   - Signing out records the session id as revoked (until it would have
     expired anyway), so a copied cookie stops working too.
   - On HTTPS the cookie is named __Host-…, which browsers only accept when it
     is Secure, has Path=/ and no Domain — it can never leak to dppl.com.np or
     any other subdomain. */

const enc = new TextEncoder();
const SESSION_HOURS = 8;
const MIN_PASSWORD = 12;

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

const isHttps = (request) => new URL(request.url).protocol === 'https:';
export const cookieName = (request) => (isHttps(request) ? '__Host-dppl_admin' : 'dppl_admin');

function secret(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return env.SESSION_SECRET;
}

function password(env) {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < MIN_PASSWORD) {
    throw new Error(`ADMIN_PASSWORD is missing or shorter than ${MIN_PASSWORD} characters.`);
  }
  return env.ADMIN_PASSWORD;
}

async function hmac(env, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Compares two strings in constant time by comparing their SHA-256 digests.
export async function sameText(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(String(s)))));
  const ax = new Uint8Array(x);
  const by = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ by[i];
  return diff === 0;
}

async function passwordFingerprint(env) {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(`pw:${password(env)}`))).slice(0, 22);
}

export async function checkPassword(env, attempt) {
  return sameText(String(attempt ?? ''), password(env));
}

const kv = (env) => env.QUOTE_RATES;

export async function createSessionCookie(env, request) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const sid = hex(crypto.getRandomValues(new Uint8Array(16)));
  const sig = await hmac(env, `${exp}.${sid}.${await passwordFingerprint(env)}`);
  const secure = isHttps(request) ? '; Secure' : '';
  return `${cookieName(request)}=${exp}.${sid}.${sig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure}`;
}

export function clearSessionCookie(request) {
  const secure = isHttps(request) ? '; Secure' : '';
  return `${cookieName(request)}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function readCookie(request) {
  const name = cookieName(request);
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  if (!raw) return null;
  const [exp, sid, sig] = raw.slice(name.length + 1).split('.');
  if (!/^\d{13}$/.test(exp || '') || !/^[a-f0-9]{32}$/.test(sid || '') || !sig) return null;
  return { exp: Number(exp), sid, sig };
}

/** The signed-in session, or null. Throws only when the server is misconfigured. */
export async function getSession(env, request) {
  const c = readCookie(request);
  if (!c || c.exp < Date.now()) return null;
  const expected = await hmac(env, `${c.exp}.${c.sid}.${await passwordFingerprint(env)}`);
  if (!(await sameText(c.sig, expected))) return null;
  if (kv(env) && (await kv(env).get(`revoked:${c.sid}`))) return null;
  return { sid: c.sid, exp: c.exp };
}

export async function revokeSession(env, request) {
  const c = readCookie(request);
  if (!c || !kv(env)) return;
  // KV needs an expiry at least 60 s ahead
  const expiration = Math.max(Math.ceil(c.exp / 1000), Math.ceil(Date.now() / 1000) + 120);
  await kv(env).put(`revoked:${c.sid}`, '1', { expiration });
}
