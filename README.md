# DPPL Website — React + Three.js + Tailwind

GPU-rendered cinematic intro (three.js WebGL globe with real Natural Earth
coastlines), Tailwind CSS design system, live silver prices from the
Cloudflare Pages Function at functions/api/silver.js.

## Run locally
  npm install
  npm run dev            # site on http://localhost:5173
  # optional, for live /api/silver locally (second terminal):
  npx wrangler pages dev dist   # after npm run build; or deploy and use prod API

## Deploy — Cloudflare Pages via GitHub
  1. Push this whole folder to a GitHub repo (root must contain package.json,
     functions/, public/, src/).
  2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
  3. Build command:  npm run build
     Output directory:  dist
  4. KV binding (once): create namespace "dppl-rates", bind it in
     Settings → Bindings as RATE_CACHE, then retry the deployment.
  5. Custom domains → add dppl.com.np.

Every git push redeploys automatically.

## Notes
- functions/api/silver.js scrapes KAGOSIDA (sale + purchase direct),
  caches per-day in KV, edge-caches 5 min. Debug: /api/silver?debug=1
- Replace data-ad-slot="0000000000" in src/components/Site.jsx (AdSlot)
  with your real AdSense slot ID after approval.
- public/ files (ads.txt, robots.txt, sitemap.xml, _headers, images) are
  copied into dist/ automatically by Vite.
