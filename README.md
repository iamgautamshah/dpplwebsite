# Diamond Palace Pvt. Ltd. — dppl.com.np

Vite + React 18 + Tailwind site, pre-rendered to flat HTML, hosted on
Cloudflare Pages with Pages Functions and KV. Includes the public quotation
form at **dppl.com.np/quotation** and the staff admin at **admin.dppl.com.np**.

Full Cloudflare setup for the quotation feature: **docs/QUOTATION-DEPLOY.md**.

## Layout

```
src/                         React site (home, journal, privacy, terms, 404)
index.html                   head, structured data, live-rate prefetch
scripts/prerender.mjs        writes flat HTML pages into dist/
public/                      copied into dist/ as-is
  quotation.html             /quotation             step 1 · customer details
  quotation/products.html    /quotation/products    step 2 · products
  quotation/price.html       /quotation/price       step 3 · price
  quotation/review.html      /quotation/review      step 4 · WhatsApp / PDF
  quotation/assets/          quotation scripts + stylesheet (site theme)
  quotation/data/            products.json, company.json, Nepal address list
  admin/                     staff page — 404 everywhere except admin host
  _routes.json               which paths run Functions
  _headers, _redirects, sitemap.xml, robots.txt, icons
functions/
  _middleware.js             1) admin only on admin host + Cloudflare Access check
                             2) gold-bar Product markup on the homepage
  api/silver.js              live KAGOSIDA / FENEGOSIDA rate (KV RATE_CACHE)
  api/quotation/*            public quotation API (customer, items, price,
                             status, quotes, quotes/[id]/pdf)
  api/admin/*                login, logout, rates, stock (session required)
server/quotation/            shared server code: validation, pricing, PDF,
                             sessions (auth.js), host + Access rules (access.js)
```

## Cloudflare bindings and variables

| Name | Type | Purpose |
|---|---|---|
| `RATE_CACHE` | KV | live market rate cache (existing) |
| `QUOTE_RATES` | KV | quotation rates, stock switches, rate history, login brake, revoked sessions |
| `QUOTES` | KV | saved quotations (deleted after 180 days) |
| `ADMIN_PASSWORD` | Secret | staff password, 12+ characters |
| `SESSION_SECRET` | Secret | 64 hex characters (`openssl rand -hex 32`) |
| `ACCESS_TEAM_DOMAIN` | Variable | e.g. `yourteam.cloudflareaccess.com` (after Access setup) |
| `ACCESS_AUD` | Variable | Access application audience tag (after Access setup) |

No password, key or secret is stored in this repository.

## Run locally

```
npm install
npm run dev          # React site only, http://localhost:5173
npm run dev:full     # everything, in the real Pages runtime with local KV:
                     #   http://localhost:8788/            site
                     #   http://localhost:8788/quotation   quotation form
                     #   http://admin.localhost:8788/      admin (Chrome/Firefox/Edge)
```

The first `npm run dev:full` creates `.dev.vars` (git-ignored) with a random
local admin password, prints it, and sets `ADMIN_HOSTS=admin.localhost`.

## Deploy

Push to GitHub; Cloudflare Pages builds with `npm run build` into `dist`.
Bindings and variables are read at deploy time — after changing them, redeploy.

## Notes

- `/api/silver?debug=1` shows which source supplied the live rate.
- Quotation prices come from the rates staff save in the admin, not from the
  live homepage rate. Until rates are saved, customers are told the price
  isn't available yet.
- Pricing rules (making charge per silver product, 0.5% skill promotion fee for
  personal customers, rounding) live in `server/quotation/rates.js`; the
  catalogue lives in `public/quotation/data/products.json`.
- The Nepal address list is MIT-licensed (`public/quotation/data/LICENSE-nepali-address`).
