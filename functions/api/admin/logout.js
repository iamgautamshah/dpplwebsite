import { json } from '../../../server/quotation/validate.js';
import { clearSessionCookie, revokeSession } from '../../../server/quotation/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    await revokeSession(env, request);
  } catch (err) {
    console.error('Revoking admin session failed:', err.message);
  }
  const res = json({ ok: true });
  res.headers.append('set-cookie', clearSessionCookie(request));
  return res;
}
