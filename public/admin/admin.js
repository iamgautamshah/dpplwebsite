import { $, clearOnInput, money, nepalTime, setError, showErrors } from '/quotation/assets/common.js';

const GRAMS_PER_TOLA = 11.6638;
const GROUP_NAME = { gold: 'Gold', goldMaking: 'Gold making charge', silver: 'Silver', making: 'Silver making charge' };

const login = $('login');
const panel = $('panel');
const ratesForm = $('rates');
const summary = $('error-summary');
const tpl = $('rate-field');

let FIELDS = [];
let stockState = { gold: true, silver: true };
const metalOf = (f) => (f.group === 'gold' || f.group === 'goldMaking' ? 'gold' : 'silver');
const isMaking = (f) => f.group === 'making' || f.group === 'goldMaking';
const activeFields = () => FIELDS.filter((f) => stockState[metalOf(f)] !== false);
let KEYS = [];
const num = (v) => Number(String(v).replace(/,/g, ''));
const hasValue = (v) => String(v).trim() !== '' && Number.isFinite(num(v));
const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;

function buildForm(fields) {
  if (FIELDS.length) return;
  FIELDS = Object.entries(fields).map(([key, f]) => ({ key, ...f }));
  KEYS = FIELDS.map((f) => f.key);
  for (const f of FIELDS) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const input = node.querySelector('input');
    input.id = f.key;
    input.setAttribute('aria-describedby', `${f.key}-hint ${f.key}-error`);
    node.querySelector('label').htmlFor = f.key;
    const prefix = document.createElement('span');
    prefix.className = 'sr-only';
    prefix.textContent = `${GROUP_NAME[f.group]} `;
    node.querySelector('.label-text').append(prefix, f.short);
    if (f.flat) node.querySelector('.unit').textContent = '(Rs. per piece)';
    if (f.percent) {
      node.querySelector('.unit').textContent = '(%)';
      node.querySelector('.money-input').classList.add('pct');
      node.querySelector('.money-input span').textContent = '%';
    }
    node.querySelector('.hint').id = `${f.key}-hint`;
    node.querySelector('.error').id = `${f.key}-error`;
    document.querySelector(`[data-group="${f.group}"]`).append(node);

    input.addEventListener('input', () => {
      const v = input.value.replace(/[^\d.,]/g, '');
      if (v !== input.value) input.value = v;
      hints();
    });
    clearOnInput(input);
  }
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
  login.hidden = false;
  setError('password', message);
  $('password').focus();
}

function hints() {
  const v = Object.fromEntries(KEYS.map((k) => [k, num($(k).value)]));
  for (const metal of ['gold', 'silver']) {
    const tola = v[`${metal}PerTola`], gram = v[`${metal}PerGram`];
    $(`${metal}PerTola-hint`).textContent = tola > 0 ? `Used for 1-tola products · ≈ ${money(tola / GRAMS_PER_TOLA)} per gram` : 'Used for tola products';
    $(`${metal}PerGram-hint`).textContent = gram > 0 ? `Used for gram products · ≈ ${money(gram * GRAMS_PER_TOLA)} per tola` : 'Used for gram products';
  }
  // gold: show what the flat charge is as a share of one piece at today's price
  for (const f of FIELDS.filter((x) => x.group === 'goldMaking')) {
    const amount = $(f.key).value;
    const piece = f.tola ? v.goldPerTola * f.tola : v.goldPerGram * f.grams;
    $(`${f.key}-hint`).textContent = hasValue(amount) && piece > 0
      ? `Per piece · ≈ ${pct((num(amount) / piece) * 100)} of a ${f.short} at today’s price`
      : 'Per piece';
  }
  for (const f of FIELDS.filter((x) => x.group === 'making')) {
    const p = $(f.key).value;
    const perPiece = f.grams > 1 && v.silverPerGram > 0 && hasValue(p);
    $(`${f.key}-hint`).textContent = perPiece
      ? `${money((v.silverPerGram * f.grams * num(p)) / 100)} per piece at today’s price`
      : f.grams === 1 && v.silverPerGram > 0 && hasValue(p)
        ? `${money((v.silverPerGram * num(p)) / 100)} per gram at today’s price`
        : '';
  }
}

function historyCell(h, f) {
  return h[f.key] == null ? '—' : f.percent ? pct(h[f.key]) : money(h[f.key]);
}

function render({ current, history, fields }) {
  buildForm(fields);
  $('updated').textContent = current.updatedAt
    ? `Current rates set ${nepalTime(current.updatedAt)}`
    : 'No rates set yet. Customers can’t get a price until you save rates.';
  for (const k of KEYS) if (current[k] != null) $(k).value = current[k];
  hints();

  const body = $('history');
  if (!history.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty';
    td.textContent = 'No changes yet.';
    tr.append(td);
    return body.replaceChildren(tr);
  }
  const priceFields = FIELDS.filter((f) => !isMaking(f));
  const makingFields = FIELDS.filter(isMaking);
  body.replaceChildren(
    ...history.map((h) => {
      const tr = document.createElement('tr');
      const cells = [[h.by ? `${nepalTime(h.updatedAt)}\n${h.by}` : nepalTime(h.updatedAt)], ...priceFields.map((f) => [historyCell(h, f), 'num'])];
      cells.forEach(([t, cls]) => {
        const td = document.createElement('td');
        td.textContent = t;
        if (cls) td.className = cls;
        tr.append(td);
      });
      const td = document.createElement('td');
      td.className = 'making-cell';
      td.textContent = makingFields.every((f) => h[f.key] == null)
        ? '—'
        : makingFields.filter((f) => h[f.key] != null).map((f) => `${f.group === 'goldMaking' ? 'Gold' : 'Silver'} ${f.short.replace(/^Silver /, '')} ${historyCell(h, f)}`).join('\n');
      tr.append(td);
      return tr;
    }),
  );
}

function syncRateSections() {
  for (const group of ['gold', 'goldMaking', 'silver', 'making']) {
    const fieldset = document.querySelector(`[data-group="${group}"]`).closest('fieldset');
    const off = stockState[group === 'gold' || group === 'goldMaking' ? 'gold' : 'silver'] === false;
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
  if (status !== 200) return showLogin(data.message || 'Couldn’t load rates.');
  login.hidden = true;
  panel.hidden = false;
  render(data);
  const stock = await api('GET', '/api/admin/stock');
  if (stock.status === 200) renderStock(stock.data);
}

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
      $('goldPerTola')?.focus();
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
    const ok = f.percent || f.flat ? hasValue(v) && num(v) >= f.min && num(v) <= f.max : num(v) > 0;
    if (!ok) errors[f.key] = f.percent ? `Enter a percentage between ${f.min}% and ${f.max}%.` : f.flat ? 'Enter an amount in rupees (0 for none).' : 'Enter a price.';
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
      $('updated').textContent = `Saved. Rates set ${nepalTime(data.current.updatedAt)}`;
    } else showErrors(summary, data.errors || { form: data.message || 'Couldn’t save rates.' }, KEYS);
  } catch {
    showErrors(summary, { form: 'Couldn’t reach the server.' }, KEYS);
  } finally {
    save.disabled = false;
    save.querySelector('span').textContent = 'Save rates';
  }
});

$('logout').addEventListener('click', async () => {
  await api('POST', '/api/admin/logout', {});
  showLogin();
});

load().catch(() => showLogin('Couldn’t reach the server. Check your connection and refresh.'));
