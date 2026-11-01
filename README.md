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
| `QUOTE_DB` | D1 (optional, recommended) | quotation number counter, guaranteed unique |
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
- Quotation prices use the same 1 tola and 10 gram selling rates the website
  publishes (`server/quotation/live.js` calls the /api/silver function
  directly). Before the day's rate is published, customers are told the price
  isn't available yet.
- Quotation numbers: `DPPL/<n>`, one running count from DPPL/01 that never restarts. With the optional D1 binding `QUOTE_DB` the count is atomic (guaranteed unique); without it, it is kept in `QUOTES` (`seq:quote`) with a claim-and-check on each number. Beneath it the PDF shows a small table with the rate date (A.D. and B.S.) and the day's gold and silver rates (1 tola and 10 grams), then the quotation time; the footer shows when the PDF was generated.
- Pricing rules (making charge per product, set in the admin as % of the metal
  value or a flat Rs amount per bar/piece, two linked boxes; 0.5% skill
  promotion fee for personal customers; rounding) live in `server/quotation/rates.js`; the
  catalogue lives in `public/quotation/data/products.json`.
- The Nepal address list is MIT-licensed (`public/quotation/data/LICENSE-nepali-address`).
