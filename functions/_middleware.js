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
import { readHistory } from '../server/rates/history.js';

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

/* 2 · The daily record on /rates, written into the HTML so it is part of the
   page search engines read, and into a JSON block the page's script picks up
   so the table does not change when React takes over. Mirrors HistoryTable
   in src/components/Pages.jsx. */
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const cell = (n) => (Number.isFinite(n) ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—');

function historyHtml(rows) {
  const body = rows.map((r) => `<tr class="border-b border-silver/10"><th scope="row" class="py-2 pr-4 text-left font-normal text-silverhi whitespace-nowrap">${dayLabel(r.date)}</th>`
    + `<td class="py-2 pr-4 text-right">${r.gold ? cell(r.gold[0]) : '—'}</td><td class="py-2 pr-4 text-right">${r.gold ? cell(r.gold[2]) : '—'}</td>`
    + `<td class="py-2 pr-4 text-right">${cell(r.silver[0])}</td><td class="py-2 text-right">${cell(r.silver[2])}</td></tr>`).join('');
  return '<div class="mt-5 overflow-x-auto"><table class="min-w-[640px] w-full text-[0.92rem]">'
    + '<caption class="sr-only">Daily gold and silver rates in Nepal, newest first, in rupees</caption>'
    + '<thead><tr class="text-left text-silver/60 border-b border-silver/15"><th scope="col" class="py-2 pr-4 font-normal">Date</th><th scope="col" class="py-2 pr-4 font-normal text-right">Gold 24K / tola</th><th scope="col" class="py-2 pr-4 font-normal text-right">Gold 24K / 10 g</th><th scope="col" class="py-2 pr-4 font-normal text-right">Silver 999 / tola</th><th scope="col" class="py-2 font-normal text-right">Silver 999 / 10 g</th></tr></thead>'
    + `<tbody class="tnum text-silver/85">${body}</tbody></table>`
    + '<p class="mt-3 text-xs text-silver/50">Selling rates in rupees, as published by the Kathmandu bullion market each day.</p></div>';
}

async function rateHistory(context) {
  const { request, env, next } = context;
  const res = await next();
  if (new URL(request.url).pathname !== '/rates' || request.method !== 'GET' || res.status !== 200) return res;
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  let html;
  try { html = await res.text(); } catch { return res; }
  const rows = await readHistory(env, 120);
  if (rows.length) {
    html = html.replace(/<div id="history-slot">[\s\S]*?<\/div>/, `<div id="history-slot">${historyHtml(rows)}</div>`);
    const data = JSON.stringify(rows).replace(/</g, '\\u003c');
    html = html.replace('</body>', `<script type="application/json" id="rate-history-data">${data}</script></body>`);
  }
  const headers = new Headers(res.headers);
  headers.delete('etag');
  headers.delete('content-length');
  headers.set('cache-control', 'public, max-age=300');
  return new Response(html, { status: 200, headers });
}

export const onRequest = [adminGate, rateHistory];
