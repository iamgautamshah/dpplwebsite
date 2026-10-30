import { json } from '../../../server/quotation/validate.js';
import { checkPassword, createSessionCookie } from '../../../server/quotation/auth.js';

// After 10 wrong passwords from one address, sign-in is refused for 15 minutes.
// (KV is eventually consistent, so treat this as a brake, not the only lock —
// Cloudflare Access and a WAF rate-limit rule sit in front of it.)
const MAX_FAILS = 10;
const WINDOW_SECONDS = 15 * 60;

export async function onRequestPost({ request, env }) {
  const { password } = await request.json().catch(() => ({}));
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const key = `login-fail:${ip}`;
  try {
    if (!env.QUOTE_RATES) throw new Error('QUOTE_RATES KV binding is missing.');
    const fails = Number((await env.QUOTE_RATES.get(key)) ?? 0);
    if (fails >= MAX_FAILS) {
      return json({ ok: false, message: 'Too many wrong passwords. Please wait 15 minutes and try again.' }, 429);
    }
    if (typeof password !== 'string' || password.length > 256 || !(await checkPassword(env, password))) {
      await env.QUOTE_RATES.put(key, String(fails + 1), { expirationTtl: WINDOW_SECONDS });
      await new Promise((r) => setTimeout(r, 1000));
      return json({ ok: false, message: 'Incorrect password.' }, 401);
    }
    await env.QUOTE_RATES.delete(key);
    const res = json({ ok: true });
    res.headers.append('set-cookie', await createSessionCookie(env, request));
    return res;
  } catch (err) {
    // the reason goes to the Cloudflare log only, never to the browser
    console.error('Admin login failed:', err.message);
    return json({ ok: false, message: 'The admin is not configured correctly. Check the Cloudflare environment variables.' }, 500);
  }
}
