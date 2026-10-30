import { json } from '../../../server/quotation/validate.js';
import { getSession } from '../../../server/quotation/auth.js';
import { isAdminHost } from '../../../server/quotation/access.js';

/* Every /api/admin/* request passes through here (after the site-wide
   middleware, which has already refused other hostnames and checked
   Cloudflare Access).

   - Only the admin hostname is served (checked again here, in case the
     site-wide middleware is ever changed).
   - Changes must be same-origin JSON: a cross-site form or script cannot
     produce that, which, with the SameSite=Strict cookie, blocks CSRF.
   - Everything except sign-in and sign-out needs a valid session. */

const OPEN = new Set(['/api/admin/login', '/api/admin/logout']);
const notFound = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

export async function onRequest({ request, env, next, data }) {
  const url = new URL(request.url);
  if (!isAdminHost(env, request.url)) return notFound();

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== url.host) return json({ message: 'Request refused.' }, 403);
    if (!(request.headers.get('content-type') || '').includes('application/json')) {
      return json({ message: 'Unsupported request.' }, 415);
    }
  }

  if (!OPEN.has(url.pathname)) {
    try {
      const session = await getSession(env, request);
      if (!session) return json({ message: 'Please sign in again.' }, 401);
      data.session = session;
    } catch (err) {
      console.error('Admin auth failed:', err.message);
      return json({ message: 'The admin is not configured correctly. Check the Cloudflare environment variables.' }, 500);
    }
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('cache-control', 'no-store');
  out.headers.set('x-robots-tag', 'noindex, nofollow');
  return out;
}
