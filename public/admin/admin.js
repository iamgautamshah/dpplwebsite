import { $, clearOnInput, money, nepalTime, setError, showErrors } from '/quotation/assets/common.js';

/* Quotation admin.
   - Today's gold and silver rates are shown read-only: they come from the
     rate the website publishes, and every quotation uses them.
   - Staff set a making charge % for each product. Beside each box, the
     amount it comes to per piece at today's rate is worked out as they type. */

const login = $('login');
const panel = $('panel');
const ratesForm = $('rates');
const summary = $('error-summary');
const tpl = $('rate-field');

let FIELDS = [];
let KEYS = [];
let live = null;
let stockState = { gold: true, silver: true };
const activeFields = () => FIELDS.filter((f) => stockState[f.metal] !== false);
const num = (v) => Number(String(v).replace(/,/g, ''));
const hasValue = (v) => String(v).trim() !== '' && Number.isFinite(num(v));
const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
const plainMoney = (n) => (n == null ? '—' : money(n));

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
  for (const f of FIELDS) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const input = node.querySelector('input');
    input.id = f.key;
    input.setAttribute('aria-describedby', `${f.key}-amount ${f.key}-error`);
    node.querySelector('label').htmlFor = f.key;
    node.querySelector('.label-text').textContent = f.short;
    node.querySelector('.making-amount').id = `${f.key}-amount`;
    node.querySelector('.making-amount').htmlFor = f.key;
    node.querySelector('.error').id = `${f.key}-error`;
    document.querySelector(`[data-group="${f.group}"]`).append(node);
    input.addEventListener('input', () => {
      const v = input.value.replace(/[^\d.,]/g, '');
      if (v !== input.value) input.value = v;
      amounts();
    });
    clearOnInput(input);
  }
}

// The rupee amount each percentage comes to at today's rate.
function amounts() {
  for (const f of FIELDS) {
    const out = $(`${f.key}-amount`);
    const v = $(f.key).value;
    const unit = unitPrice(f);
    const per = f.unit === 'gram' ? 'per gram' : f.metal === 'gold' || /bar/i.test(f.short) ? 'per bar' : 'per piece';
    if (!hasValue(v)) out.textContent = '';
    else if (unit == null) out.textContent = 'Today’s rate not published yet';
    else out.textContent = `= ${money(Math.round(unit * num(v)) / 100)} ${per}`;
  }
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

function makingList(h, metal) {
  const rows = FIELDS.filter((f) => f.metal === metal && h[f.key] != null);
  return rows.length ? rows.map((f) => `${f.short}: ${pct(h[f.key])}`).join('\n') : '—';
}

function render({ current, history, fields, live: r }) {
  buildForm(fields);
  $('updated').textContent = current.updatedAt
    ? `Making charges last saved ${nepalTime(current.updatedAt)}`
    : 'No making charges saved yet. Customers can’t get a price until you save them.';
  for (const k of KEYS) if (current[k] != null) $(k).value = current[k];
  renderLive(r);

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

function renderStock(s) {
  stockState = { gold: s.gold, silver: s.silver };
  syncRateSections();
  $('stock-gold').checked = s.gold;
  $('stock-silver').checked = s.silver;
  const el = $('stock-status');
  el.dataset.state = s.gold && s.silver ? 'open' : s.open ? 'partial' : 'closed';
  el.textContent = s.gold && s.silver
    ? 'Quotation form is open for gold and silver.'
    : s.open
      ? `Quotation form is open for ${s.gold ? 'gold' : 'silver'} only. ${s.gold ? 'Silver' : 'Gold'} is shown as out of stock.`
      : 'Quotation form is closed. Customers see the out-of-stock message.';
}

async function saveStock() {
  const inputs = [$('stock-gold'), $('stock-silver')];
  inputs.forEach((i) => (i.disabled = true));
  try {
    const { status, data } = await api('PUT', '/api/admin/stock', { gold: inputs[0].checked, silver: inputs[1].checked });
    if (status === 401) return showLogin('Your session expired. Sign in again.');
    if (data.ok) renderStock(data);
    else $('stock-status').textContent = data.message || 'Couldn’t save availability.';
  } catch {
    $('stock-status').textContent = 'Couldn’t reach the server. Availability wasn’t changed.';
  } finally {
    inputs.forEach((i) => (i.disabled = false));
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
    const v = $(f.key).value;
    if (!(hasValue(v) && num(v) >= f.min && num(v) <= f.max)) errors[f.key] = `Enter a percentage between ${f.min}% and ${f.max}%.`;
  }
  showErrors(summary, errors, KEYS);
  if (Object.keys(errors).length) return;

  const save = $('save');
  save.disabled = true;
  save.querySelector('span').textContent = 'Saving…';
  try {
    const { status, data } = await api('PUT', '/api/admin/rates', Object.fromEntries(activeFields().map((f) => [f.key, $(f.key).value])));
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
