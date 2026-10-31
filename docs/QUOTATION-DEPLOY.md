# Quotation feature — Cloudflare setup, deployment and testing

This adds two things to the existing Cloudflare Pages project (the one that
already serves dppl.com.np):

| Address | What it is | Who can reach it |
|---|---|---|
| `https://dppl.com.np/quotation` | public 4-step quotation form | everyone |
| `https://admin.dppl.com.np` | staff page: rates, making charges, stock | approved staff only |

Both run from the **same** Pages project and the same GitHub repository. You
do not create a second project.

---

## How the admin is protected (three layers)

1. **Hostname lock, in code.** Every admin page (`/admin…`) and admin API
   (`/api/admin/…`) answers *404 Not Found* on any hostname other than
   `admin.dppl.com.np` — including `dppl.com.np`, `www.dppl.com.np` and the
   `*.pages.dev` addresses. The public quotation pages contain no admin code
   or links.
2. **Cloudflare Access, at the edge.** Before anything on `admin.dppl.com.np`
   loads, Cloudflare asks for an approved staff email and sends a one-time
   code to it. The admin also verifies the signed token Access attaches to each
   request (once `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are set).
3. **Admin password.** Checked on the server only. It is stored only as an
   encrypted Cloudflare secret.
   - Sessions last 8 hours, in an HttpOnly, Secure, SameSite=Strict `__Host-` cookie that never reaches dppl.com.np.
   - Signing out ends the session for real.
   - Changing the password signs everyone out.
   - After 10 wrong passwords from one address, sign-in is blocked for 15 minutes.
   - Every change must come from the admin page itself, which blocks cross-site requests.

---

## Part A — One-time Cloudflare setup (you do this)

Do the steps in order. Steps A1–A4 must be finished **before** you push the
new code. If you push first, the site still works, but the quotation form says
the service is unavailable until the bindings exist.

### A1. Create two KV namespaces

1. Cloudflare dashboard → **Storage & Databases → KV** (older dashboards: *Workers & Pages → KV*).
2. **Create namespace** → name `dppl-quote-rates`.
3. **Create namespace** → name `dppl-quotes`.

(You already have the one used by `RATE_CACHE` for the live price. Leave it alone.)

### A2. Bind them to the Pages project

Workers & Pages → your dppl.com.np Pages project → **Settings → Bindings → Add → KV namespace**:

| Variable name | KV namespace |
|---|---|
| `QUOTE_RATES` | `dppl-quote-rates` |
| `QUOTES` | `dppl-quotes` |

The variable names must match exactly, in capitals.

If the project has separate **Production** and **Preview** settings, add the
bindings to Production. For Preview, use separate namespaces such as
`dppl-quote-rates-preview` if you want to test without touching real quotes.

### A3. Add the secrets

Same project → **Settings → Variables and Secrets → Add**. Choose type **Secret** (encrypted) for both:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | A strong staff password, **at least 12 characters**. A 4–5 word passphrase is good. Don't reuse a password used anywhere else. |
| `SESSION_SECRET` | 64 random hex characters. Generate with `openssl rand -hex 32`, or a password manager set to 64 characters (letters and digits). |

Never put these in the code, in GitHub, in WhatsApp or in email. Share the
admin password with staff in person or through a password manager.

### A4. Add the admin subdomain

1. Same project → **Custom domains → Set up a custom domain**.
2. Enter `admin.dppl.com.np` → **Continue → Activate domain**.
3. Because dppl.com.np is already on Cloudflare, the DNS record is created for
   you: a proxied CNAME, `admin` → `<your-project>.pages.dev`. Check under
   **DNS → Records** that it exists and shows the orange cloud (Proxied).
4. Wait until the domain shows **Active** (usually a few minutes; the SSL certificate is issued automatically).

`dppl.com.np/quotation` needs **no DNS change**. It's a path on the domain
you already have, served by the new files in the repository.

### A5. Put Cloudflare Access in front of the admin

1. Open **Zero Trust** from the dashboard sidebar. If it's your first time, pick
   a team name; the Free plan covers up to 50 users. You may be asked for a
   payment method even on the free plan.
2. **Access → Applications → Add an application → Self-hosted**.
3. Application name: `DPPL quotation admin`.
4. Domain: subdomain `admin`, domain `dppl.com.np`. **Leave the path empty** so
   the whole subdomain is protected.
5. Session duration: `8 hours` (to match the admin's own session) or `24 hours`.
6. Add a policy:
   - Name `Staff`, Action **Allow**.
   - Include → **Emails** → list each staff member's email address.
     (Or use *Emails ending in* only if everyone at that domain should get in.)
7. Login methods: keep **One-time PIN**. It emails a code to the address entered.
8. Save the application.

Now copy two values for the next step:

- **Application Audience (AUD) Tag**: open the application you just made (its
  Overview or Basic information panel). It's a long hex string.
- **Team domain**: Zero Trust → **Settings** → look for *Team name and domain*.
  It looks like `yourteam.cloudflareaccess.com`.

**Do not** add an Access application for `dppl.com.np` itself. That would lock
customers out of the website.

### A6. Tell the admin to verify Access tokens

Pages project → Settings → Variables and Secrets → Add (type **Text** is fine; these aren't secret):

| Name | Value |
|---|---|
| `ACCESS_TEAM_DOMAIN` | e.g. `yourteam.cloudflareaccess.com` (no `https://`) |
| `ACCESS_AUD` | the AUD tag from A5 |

With these set, a request that didn't pass Access is refused with 403, even
with the correct password.

### A7. (Recommended) Rate-limit the sign-in endpoint

Dashboard → dppl.com.np zone → **Security → WAF → Rate limiting rules → Create rule**:

- When incoming requests match: *Hostname* equals `admin.dppl.com.np` **and**
  *URI Path* equals `/api/admin/login` **and** *Request Method* equals `POST`
- Rate: about **5 requests per 10 seconds**, counted per IP
- Action: **Block** (the Free plan allows one rule with a 10-second period and block duration)

---

## Part B — Deploy

1. Replace the repository contents with the updated project. Keep your `.git`
   folder. Don't commit `node_modules/`, `dist/`, `.dev.vars` or `.wrangler/`;
   `.gitignore` already excludes them.
2. Commit and push to the branch Cloudflare deploys (usually `main`).
3. Cloudflare Pages builds automatically. The build settings are unchanged:
   build command `npm run build`, output directory `dist`.
4. **Bindings and variables only apply to new deployments.** If you added them
   after the last build, open **Deployments** and choose **Retry deployment**
   on the latest one.
5. When the build is green, run the checklist below.
6. In Google Search Console, resubmit `https://dppl.com.np/sitemap.xml`. It now
   includes `/quotation`.

### First use

1. Open `https://admin.dppl.com.np`, enter your staff email, then type the
   one-time code from your inbox.
2. Enter the admin password.
3. Check **Today's rates**: the gold and silver 1 tola and 10 gram selling rates
   come from the website automatically. Nothing needs typing.
4. Enter the making charge for every product (0 for none). Each product has two
   linked boxes: **Percentage** and **Flat amount per bar** (per piece for
   coins, per gram for grains). Type in either and the other fills in at
   today's rate. The box you typed in last decides how it's charged:
   - **Flat amount**: a fixed rupee amount per bar or piece. It stays the same when the rate moves.
   - **Percentage**: a share of the metal value, so it moves with the rate.
   Click **Save making charges**. A product with no making charge saved can't be quoted.
5. Before the day's rate is published (or if both sources are down), customers
   see "Today's price isn't available yet" at the Price step, as the homepage
   does. Yesterday's rate is never used.

---

## Part C — Test checklist

Tick each item after deploying. Use a private/incognito window for the
"outsider" checks.

**Public quotation flow**
- [ ] `dppl.com.np` opens straight onto the page, with no intro screen. The menu shows QUOTATION, and Products has "Request a quotation".
- [ ] `dppl.com.np/quotation` loads in the site's navy/gold style. `dppl.com.np/quotation/` redirects to it.
- [ ] Step 1 asks for the name, then the PAN. It refuses a PAN that isn't 9 digits, a phone number that isn't 10 digits, and a name in Nepali script.
- [ ] Step 2: product names show the fineness, e.g. *Gold Bar - 10g (999.9)*, *Silver Bar - 100g (999)*. Personal customers don't see *Silver Grains*; Business customers do.
- [ ] Step 3 shows each line, one "Making charge" line (the charge for each product is listed above the table as "Rs. … per bar (…%)"), the 0.5% skill promotion fee (Personal only) and a total. Check one total by hand.
- [ ] Step 4: **Download PDF** saves `Quotation-DPPL-YYYYMMDD.pdf` with the right details.
- [ ] Step 4: **Send on WhatsApp** opens WhatsApp to +977 9805617932 with the quotation number and a PDF link, and the link opens the PDF.

**Price updates**
- [ ] The admin's **Today's rates** match the homepage rate board (gold and silver, 1 tola and 10 grams).
- [ ] Type a % for one product: its flat amount box fills in. Type a flat amount for another: its % fills in. Save; "Recent changes" shows the flat one as "Rs. … per bar" (or per piece) and the other as a % (with the staff email once Access is set up).
- [ ] Price step check for a flat charge: Silver Bar - 100g at Rs. 300 per bar, quantity 3, gives a making charge of Rs. 900.
- [ ] Recalculate on the public Price step: the new making charge is used.
- [ ] Change a making charge *while* a customer is on the Review step, then press Download PDF. The customer is told prices changed and shown the new total before anything is saved.
- [ ] The PDF shows `No. DPPL/<date>` with a small table of the day's gold and silver rates (1 tola and 10 grams) beneath it, and the columns Product, Quantity, Weight, Rate and Amount, with nothing printed under the weight or rate.
- [ ] Turn **Gold in stock** off: gold disappears from Products, and an open Price page with gold shows the out-of-stock message. Turn it back on.
- [ ] Turn both metals off: every quotation page shows "We're out of stock". Turn both back on.

**Administrator access**
- [ ] `https://admin.dppl.com.np` in a private window shows the **Cloudflare Access** login first, not the admin page.
- [ ] An email not on the policy gets no code and no access.
- [ ] After Access, a wrong password shows "Incorrect password"; the right one opens the admin.
- [ ] **Log out** (top right, or bottom of the rates form): you're taken through Cloudflare's sign-out, and opening the admin again asks for the email code and the password.

**Things that must fail**
- [ ] `https://dppl.com.np/admin/` → 404 page.
- [ ] `https://dppl.com.np/api/admin/rates` → 404.
- [ ] `https://<project>.pages.dev/admin/` → 404.
- [ ] `https://admin.dppl.com.np/api/admin/rates` opened directly in a new private window → blocked by Access (or, after Access, "Please sign in again").
- [ ] Ten wrong passwords in a row → "Too many wrong passwords", even for the right one, for 15 minutes.
- [ ] `https://dppl.com.np/api/quotation/quotes/00000000000000000000000000000000/pdf` → "Quotation not found".
- [ ] Before any rates are saved (or right after a fresh setup), the Price step says the price isn't available and won't continue.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Quotation pages say "service isn't available" / admin says "not configured correctly" | `QUOTE_RATES` / `QUOTES` binding or a secret is missing, or was added after the last deploy | Check A2/A3, then **Retry deployment** |
| Admin sign-in always says "not configured correctly" | `ADMIN_PASSWORD` shorter than 12 characters, or `SESSION_SECRET` shorter than 32 | Fix the secret and redeploy |
| `admin.dppl.com.np` shows "Access denied." after the Access login | `ACCESS_AUD` or `ACCESS_TEAM_DOMAIN` doesn't match the Access application | Copy both values again (A5/A6) and redeploy |
| `admin.dppl.com.np` doesn't load at all | Custom domain not active yet, or the DNS record isn't proxied | Check A4 |
| Everyone was signed out | `ADMIN_PASSWORD` or `SESSION_SECRET` was changed | Expected. Sign in again. |
| Staff member left | Remove their email from the Access policy, then change `ADMIN_PASSWORD` and redeploy | Signs out every device |

Function logs: Pages project → **Deployments → (latest) → Functions → Real-time logs**.

## Data kept

- **`QUOTES`:** each quotation (customer details, PAN, phone, address, products,
  price), deleted automatically after 180 days. The PDF link uses a random
  32-character ID; anyone holding the link can open it.
- **`QUOTE_RATES`:** current rates, the last 50 rate changes, stock switches,
  short-lived sign-in counters and revoked-session markers.

The privacy policy (`/privacy`) and terms (`/terms`) describe this.
