import { $, clearOnInput, money, nepalTime, setError, showErrors } from '/quotation/assets/common.js?v=20261104b';

/* Quotation admin.
   - Today's gold and silver rates are shown read-only: they come from the
     rate the website publishes, and every quotation uses them.
   - Staff set each product's making charge as a % of the metal value or as a
     flat amount per bar/piece (per gram for grains). The two boxes are linked:
     typing in one fills the other at today's rate. The box typed in last
     decides how it is charged (a flat amount stays fixed when the rate moves;
     a % follows it).
   - Personal and business customers each have their own charge per product
     (Silver Grains are sold to businesses only). */

const login = $('login');
const panel = $('panel');
const ratesForm = $('rates');
const summary = $('error-summary');
const tpl = $('rate-field');
const productTpl = $('rate-product');
const CUSTOMER_NAME = { personal: 'Personal', business: 'Business' };

let FIELDS = [];
let KEYS = [];
let live = null;
let stockState = { gold: true, silver: true };
const basis = {}; // key → 'pct' | 'flat', whichever box was typed in last
const MAX_PER_UNIT = 10000000;
const activeFields = () => FIELDS.filter((f) => stockState[f.metal] !== false);
const num = (v) => Number(String(v).replace(/,/g, ''));
const hasValue = (v) => String(v).trim() !== '' && Number.isFinite(num(v));
const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
const plainMoney = (n) => (n == null ? '—' : money(n));
const round2 = (n) => Math.round(Number((n * 100).toPrecision(12))) / 100;
const round4 = (n) => Math.round(Number((n * 10000).toPrecision(12))) / 10000;
const flatId = (key) => `${key}__perUnit`;
const unitWord = (f) => (f.unit === 'gram' ? 'gram' : f.metal === 'gold' || /bar/i.test(f.short) ? 'bar' : 'piece');
const plainNum = (n, dp) => String(Number(n.toFixed(dp)));

/** Price of one piece (or one gram for grains) at today's rate, as the server works it out. */
function unitPrice(f) {
  const r = live && (f.metal === 'gold' ? { tola: live.goldPerTola, g10: live.goldPer10g } : { tola: live.silverPerTola, g10: live.silverPer10g });
  if (!r || !(r.tola > 0) || !(r.g10 > 0)) return null;
  return f.tola ? r.tola * f.tola : (r.g10 * f.grams) / 10;
}

function buildForm(fields) {
  if (FIELDS.length) return;
  FIELDS = Object.entries(fields).map(([key, f]) => ({ key, ...f }));
  KEYS = FIELDS.map((f) => f.key);
  const cards = {};
  for (const f of FIELDS) {
    // one card per product, holding a row per customer type
    if (!cards[f.productId]) {
      const card = productTpl.content.firstElementChild.cloneNode(true);
      card.querySelector('.making-name').textContent = f.short;
      document.querySelector(`[data-group="${f.group}"]`).append(card);
      cards[f.productId] = card.querySelector('.making-customers');
    }
    const node = tpl.content.firstElementChild.cloneNode(true);
    const pctIn = node.querySelector('[data-kind="pct"]');
    const flatIn = node.querySelector('[data-kind="flat"]');
    pctIn.id = f.key;
    flatIn.id = flatId(f.key);
    const describedBy = `${f.key}-amount ${f.key}-error`;
    pctIn.setAttribute('aria-describedby', describedBy);
    flatIn.setAttribute('aria-describedby', describedBy);
    pctIn.setAttribute('aria-label', `${f.short}, ${CUSTOMER_NAME[f.customer]} customers, making charge percentage`);
    flatIn.setAttribute('aria-label', `${f.short}, ${CUSTOMER_NAME[f.customer]} customers, making charge flat rupees per ${unitWord(f)}`);
    node.querySelector('.making-customer').textContent = f.productId === 'silver-granules' ? 'Business (only)' : CUSTOMER_NAME[f.customer];
    node.querySelectorAll('.making-label')[1].textContent = `Flat amount per ${unitWord(f)}`;
    node.querySelector('.making-amount').id = `${f.key}-amount`;
    node.querySelector('.error').id = `${f.key}-error`;
    cards[f.productId].append(node);
    for (const [input, kind] of [[pctIn, 'pct'], [flatIn, 'flat']]) {
      input.addEventListener('input', () => {
        const v = input.value.replace(/[^\d.,]/g, '');
        if (v !== input.value) input.value = v;
        basis[f.key] = kind;
        sync(f);
        if (pctIn.getAttribute('aria-invalid') || flatIn.getAttribute('aria-invalid')) {
          setError(f.key);
          flatIn.removeAttribute('aria-invalid');
        }
      });
    }
    clearOnInput(pctIn);
  }
}

/* Fill the box the staff didn't type in from the one they did, at today's
   rate, and show what the charge comes to per bar or piece. */
function sync(f) {
  const pctIn = $(f.key);
  const flatIn = $(flatId(f.key));
  const pg = unitPrice(f);
  const kind = basis[f.key] || 'pct';
  const src = kind === 'flat' ? flatIn : pctIn;
  const other = kind === 'flat' ? pctIn : flatIn;
  if (!hasValue(src.value)) {
    other.value = '';
  } else if (pg) {
    other.value = kind === 'flat' ? plainNum(round4((num(src.value) / pg) * 100), 4) : plainNum(round2((pg * num(src.value)) / 100), 2);
  }
  amount(f);
}

// The flat box already shows the rupee amount per bar or piece; this line
// only speaks up when today's rate isn't there to link the two boxes.
function amount(f) {
  const out = $(`${f.key}-amount`);
  const v = (basis[f.key] === 'flat' ? $(flatId(f.key)) : $(f.key)).value;
  out.textContent = hasValue(v) && unitPrice(f) == null ? 'Today’s rate isn’t published yet, so the other box can’t be worked out.' : '';
}

function amounts() {
  for (const f of FIELDS) sync(f);
}

function renderLive(r) {
  live = r;
  const set = (id, v) => { $(id).textContent = plainMoney(v); };
  set('live-gold-tola', r?.goldPerTola);
  set('live-gold-g10', r?.goldPer10g);
  set('live-silver-tola', r?.silverPerTola);
  set('live-silver-g10', r?.silverPer10g);
  const src = r?.source === 'FENEGOSIDA' ? 'Federation of Nepal Gold and Silver Dealers’ Association (FENEGOSIDA)' : 'Kathmandu Gold and Silver Dealers’ Association (KAGOSIDA)';
  $('live-status').textContent = r?.date
    ? `Selling rates for ${new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}, source: ${src}.`
    : 'Today’s rate has not been published yet, or both sources are unavailable. Customers are told the price isn’t available until it is.';
  amounts();
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

function showLogin(message) {
  panel.hidden = true;
  $('logout-top').hidden = true;
  login.hidden = false;
  setError('password', message);
  $('password').focus();
}

function makingText(h, f) {
  if (h.basis?.[f.key] === 'flat' && h.perUnit?.[f.key] != null) return `${money(h.perUnit[f.key])} per ${unitWord(f)}`;
  return h[f.key] == null ? null : pct(h[f.key]);
}

// e.g. "Gold Bar - 5g: Personal 3%, Business Rs. 2,000.00 per bar"
function makingList(h, metal) {
  const byProduct = new Map();
  for (const f of FIELDS.filter((x) => x.metal === metal)) {
    const t = makingText(h, f);
    if (!t) continue;
    if (!byProduct.has(f.productId)) byProduct.set(f.productId, { short: f.short, parts: [] });
    byProduct.get(f.productId).parts.push(`${CUSTOMER_NAME[f.customer]} ${t}`);
  }
  return byProduct.size ? [...byProduct.values()].map((p) => `${p.short}: ${p.parts.join(', ')}`).join('\n') : '—';
}

// The personal field for the same product (business charges start from it).
const personalOf = (f) => FIELDS.find((x) => x.productId === f.productId && x.customer === 'personal');

function fillField(f, source, from) {
  const k = f.key;
  if (source.basis?.[from] === 'flat' && source.perUnit?.[from] != null) {
    basis[k] = 'flat';
    $(flatId(k)).value = plainNum(source.perUnit[from], 2);
    $(k).value = source[from] != null ? plainNum(source[from], 4) : '';
  } else {
    basis[k] = 'pct';
    $(k).value = source[from] != null ? plainNum(source[from], 4) : '';
    $(flatId(k)).value = '';
  }
}

function render({ current, history, fields, live: r }) {
  buildForm(fields);
  $('updated').textContent = current.updatedAt
    ? `Making charges last saved ${nepalTime(current.updatedAt)}`
    : 'No making charges saved yet. Customers can’t get a price until you save them.';
  for (const f of FIELDS) {
    const own = current[f.key] != null || current.perUnit?.[f.key] != null;
    // a business charge never saved shows the personal one, which is what business customers pay until then
    const legacyKey = f.key.replace(/_biz$/, '');
    fillField(f, current, own || f.customer !== 'business' ? f.key : legacyKey);
  }
  renderLive(r); // fills the linked boxes at today's rate

  const body = $('history');
  if (!history.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'empty';
    td.textContent = 'No changes yet.';
    tr.append(td);
    return body.replaceChildren(tr);
  }
  body.replaceChildren(
    ...history.map((h) => {
      const tr = document.createElement('tr');
      for (const [text, cls] of [[h.by ? `${nepalTime(h.updatedAt)}\n${h.by}` : nepalTime(h.updatedAt)], [makingList(h, 'gold'), 'making-cell'], [makingList(h, 'silver'), 'making-cell']]) {
        const td = document.createElement('td');
        td.textContent = text;
        if (cls) td.className = cls;
        tr.append(td);
      }
      return tr;
    }),
  );
}

function syncRateSections() {
  for (const group of ['goldMaking', 'making']) {
    const fieldset = document.querySelector(`[data-group="${group}"]`).closest('fieldset');
    const off = stockState[group === 'goldMaking' ? 'gold' : 'silver'] === false;
    fieldset.hidden = off;
    if (off) FIELDS.filter((f) => f.group === group).forEach((f) => setError(f.key));
  }
  summary.hidden = true;
  const none = !stockState.gold && !stockState.silver;
  $('rates-closed').hidden = !none;
  $('save').hidden = none;
}

// One switch per product, under its metal. Names come from the making-charge fields.
const productSwitch = (id) => document.querySelector(`[data-product-switch="${id}"]`);
function buildProductSwitches(products) {
  if (document.querySelector('[data-product-switch]')) return;
  for (const f of FIELDS) {
    if (!(f.productId in products)) continue;
    const label = document.createElement('label');
    label.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('role', 'switch');
    input.dataset.productSwitch = f.productId;
    input.dataset.metal = f.metal;
    const track = document.createElement('span');
    track.className = 'track';
    track.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.textContent = f.short;
    label.append(input, track, name);
    $(`stock-products-${f.metal}`).append(label);
    input.addEventListener('change', saveStock);
  }
}

function renderStock(s) {
  stockState = { gold: s.gold, silver: s.silver };
  syncRateSections();
  $('stock-gold').checked = s.gold;
  $('stock-silver').checked = s.silver;
  buildProductSwitches(s.products || {});
  for (const [id, on] of Object.entries(s.products || {})) {
    const input = productSwitch(id);
    if (!input) continue;
    input.checked = on;
    const metalOn = s[input.dataset.metal];
    input.disabled = !metalOn; // a metal switched off takes all its products with it
    input.closest('.switch').classList.toggle('is-off-metal', !metalOn);
  }
  const nameOf = (id) => FIELDS.find((f) => f.productId === id)?.short ?? id;
  const productsOff = Object.entries(s.products || {})
    .filter(([id, on]) => !on && s[productSwitch(id)?.dataset.metal] !== false)
    .map(([id]) => nameOf(id));
  const metalsOut = ['gold', 'silver'].filter((m) => !(s.available ? s.available[m] : s[m]));
  const el = $('stock-status');
  el.dataset.state = !s.open ? 'closed' : metalsOut.length || productsOff.length ? 'partial' : 'open';
  const parts = [];
  if (!s.open) parts.push('Quotation form is closed. Customers see the out-of-stock message.');
  else if (metalsOut.length) parts.push(`Quotation form is open for ${metalsOut.includes('gold') ? 'silver' : 'gold'} only. ${metalsOut.includes('gold') ? 'Gold' : 'Silver'} is shown as out of stock.`);
  else parts.push('Quotation form is open for gold and silver.');
  if (s.open && productsOff.length) parts.push(`Out of stock: ${productsOff.join(', ')}.`);
  el.textContent = parts.join(' ');
}

async function saveStock() {
  const productInputs = [...document.querySelectorAll('[data-product-switch]')];
  const inputs = [$('stock-gold'), $('stock-silver'), ...productInputs];
  inputs.forEach((i) => (i.disabled = true));
  try {
    const products = Object.fromEntries(productInputs.map((i) => [i.dataset.productSwitch, i.checked]));
    const { status, data } = await api('PUT', '/api/admin/stock', { gold: inputs[0].checked, silver: inputs[1].checked, products });
    if (status === 401) return showLogin('Your session expired. Sign in again.');
    if (data.ok) renderStock(data);
    else $('stock-status').textContent = data.message || 'Couldn’t save availability.';
  } catch {
    $('stock-status').textContent = 'Couldn’t reach the server. Availability wasn’t changed.';
  } finally {
    // metal switches back on; a product switch only while its metal is on
    $('stock-gold').disabled = false;
    $('stock-silver').disabled = false;
    productInputs.forEach((i) => { i.disabled = !$(`stock-${i.dataset.metal}`).checked; });
  }
}

$('stock-gold').addEventListener('change', saveStock);
$('stock-silver').addEventListener('change', saveStock);

async function load() {
  const { status, data } = await api('GET', '/api/admin/rates');
  if (status === 401) return showLogin();
  if (status !== 200) return showLogin(data.message || 'Couldn’t load the settings.');
  login.hidden = true;
  panel.hidden = false;
  $('logout-top').hidden = false;
  render(data);
  const stock = await api('GET', '/api/admin/stock');
  if (stock.status === 200) renderStock(stock.data);
}

document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', () => {
  for (const f of FIELDS.filter((x) => x.group === btn.dataset.copy && x.customer === 'business')) {
    const p = personalOf(f);
    if (!p) continue;
    basis[f.key] = basis[p.key] || 'pct';
    $(f.key).value = $(p.key).value;
    $(flatId(f.key)).value = $(flatId(p.key)).value;
    setError(f.key);
    sync(f);
  }
  btn.textContent = 'Copied. Save to keep it.';
  setTimeout(() => { btn.textContent = 'Copy personal charges to business'; }, 2500);
}));

$('live-refresh').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const { status, data } = await api('GET', '/api/admin/rates');
    if (status === 401) return showLogin('Your session expired. Sign in again.');
    if (status === 200) renderLive(data.live);
  } finally {
    btn.disabled = false;
  }
});

login.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('login-btn');
  btn.disabled = true;
  try {
    const { status, data } = await api('POST', '/api/admin/login', { password: $('password').value });
    if (status === 200) {
      $('password').value = '';
      setError('password');
      await load();
      activeFields()[0] && $(activeFields()[0].key).focus();
    } else showLogin(data.message || 'Couldn’t sign in.');
  } catch {
    showLogin('Couldn’t reach the server.');
  }
  btn.disabled = false;
});

ratesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errors = {};
  for (const f of activeFields()) {
    if (basis[f.key] === 'flat') {
      const v = $(flatId(f.key)).value;
      if (!(hasValue(v) && num(v) >= 0 && num(v) <= MAX_PER_UNIT)) errors[f.key] = `${f.short} (${CUSTOMER_NAME[f.customer]}): enter a flat amount between Rs. 0 and Rs. ${MAX_PER_UNIT.toLocaleString('en-IN')}.`;
    } else {
      const v = $(f.key).value;
      if (!(hasValue(v) && num(v) >= f.min && num(v) <= f.max)) errors[f.key] = `${f.short} (${CUSTOMER_NAME[f.customer]}): enter a percentage between ${f.min}% and ${f.max}%.`;
    }
  }
  showErrors(summary, errors, KEYS);
  // point the error at the box the staff typed in
  for (const k of Object.keys(errors)) {
    if (basis[k] === 'flat') { $(k).removeAttribute('aria-invalid'); $(flatId(k)).setAttribute('aria-invalid', 'true'); }
  }
  if (Object.keys(errors).length) return;

  const save = $('save');
  save.disabled = true;
  save.querySelector('span').textContent = 'Saving…';
  try {
    const body = {};
    for (const f of activeFields()) {
      body[f.key] = $(f.key).value;
      body[`${f.key}__perUnit`] = $(flatId(f.key)).value;
      body[`${f.key}__basis`] = basis[f.key] === 'flat' ? 'flat' : 'pct';
    }
    const { status, data } = await api('PUT', '/api/admin/rates', body);
    if (status === 401) return showLogin('Your session expired. Sign in again.');
    if (data.ok) {
      render({ ...data, fields: null });
      $('updated').textContent = `Saved. Making charges set ${nepalTime(data.current.updatedAt)}`;
    } else showErrors(summary, data.errors || { form: data.message || 'Couldn’t save making charges.' }, KEYS);
  } catch {
    showErrors(summary, { form: 'Couldn’t reach the server.' }, KEYS);
  } finally {
    save.disabled = false;
    save.querySelector('span').textContent = 'Save making charges';
  }
});

// Log out ends the admin session on the server, then the Cloudflare Access
// session too, so the next person at this computer must verify their email
// and enter the password again.
async function logout(button) {
  button.disabled = true;
  try { await api('POST', '/api/admin/logout', {}); } catch { /* the cookie is cleared regardless */ }
  if (!/(^|\.)localhost$/.test(location.hostname)) {
    location.href = '/cdn-cgi/access/logout';
    return;
  }
  button.disabled = false;
  showLogin();
}
$('logout').addEventListener('click', (e) => logout(e.currentTarget));
$('logout-top').addEventListener('click', (e) => logout(e.currentTarget));

load().catch(() => showLogin('Couldn’t reach the server. Check your connection and refresh.'));
