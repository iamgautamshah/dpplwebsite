/* Site-wide middleware.

   adminGate keeps the quotation admin on its own hostname (admin.dppl.com.np),
   behind Cloudflare Access — see server/quotation/access.js for why that has
   to happen in code. _routes.json limits Functions to "/", "/api/*" and
   "/admin*", so this never runs for images, scripts or the other pages.

   It used to also inject Product markup for the gold bar with the day's
   price. Gold bars now carry a making charge per bar that varies by weight,
   so no single published rate is the price a customer pays — and Google
   requires the markup price to match. The markup was removed rather than
   publish a price that would be wrong. */

import { isAdminHost, isAdminPath, verifyAccess } from '../server/quotation/access.js';

const ADMIN_HEADERS = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'cross-origin-opener-policy': 'same-origin',
  'permissions-policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; '),
};

function withAdminHeaders(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(ADMIN_HEADERS)) out.headers.set(k, v);
  return out;
}

async function notFound(env, request) {
  try {
    const page = await env.ASSETS.fetch(new URL('/404', request.url));
    if (page.ok) {
      return new Response(page.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
    }
  } catch { /* fall through */ }
  return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
}

/* 1 · The admin exists only on the admin hostname, behind Cloudflare Access.
   On dppl.com.np (and *.pages.dev) every admin page and API is a plain 404. */
async function adminGate(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);

  if (!isAdminHost(env, request.url)) {
    return isAdminPath(url.pathname) ? notFound(env, request) : next();
  }

  const access = await verifyAccess(env, request);
  if (!access.ok) {
    console.warn('[admin] Cloudflare Access check failed:', access.reason);
    return withAdminHeaders(new Response('Access denied.', { status: 403, headers: { 'content-type': 'text/plain' } }));
  }
  data.accessEmail = access.email;

  if (url.pathname === '/') return withAdminHeaders(await env.ASSETS.fetch(new URL('/admin/', url)));
  if (isAdminPath(url.pathname)) return withAdminHeaders(await next());
  // the public site's Functions have no business on the admin hostname
  if (url.pathname.startsWith('/api/')) return notFound(env, request);
  return Response.redirect(new URL('/', url).toString(), 302);
}

export const onRequest = [adminGate];
