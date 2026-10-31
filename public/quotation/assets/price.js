import { blockedMetals, onStockChange, refreshStock, showMetalOut } from './gate.js?v=20261031e';
import { $, money, postJSON, store } from './common.js?v=20261031e';
import { pct, renderLines, renderTotals } from './quote-table.js?v=20261031e';

const customer = store.get('quote.customer');
const items = store.get('quote.items');
if (!customer) location.replace('/quotation');
else if (!items?.length) location.replace('/quotation/products');

const RATE_KEYS = ['goldPerTola', 'goldPer10g', 'silverPerTola', 'silverPer10g'];

// Display helpers that skip an element the page doesn't have, so a page and
// script from different releases can never stop the price being shown.
const show = (id, visible) => { const el = $(id); if (el) el.hidden = !visible; };
const fill = (id, nodes) => { const el = $(id); if (el) el.replaceChildren(...nodes); };
const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
const next = $('next');

function blockNext(blocked) {
  next.setAttribute('aria-disabled', String(blocked));
  next.classList.toggle('is-disabled', blocked);
}

next.addEventListener('click', (e) => {
  if (next.getAttribute('aria-disabled') === 'true') e.preventDefault();
});

function alertBox(title, text) {
  const box = $('alert');
  const strong = document.createElement('strong');
  strong.textContent = title;
  box.replaceChildren(strong, document.createTextNode(text));
  box.hidden = false;
}

function makingRow(name, value) {
  const div = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = name;
  const dd = document.createElement('dd');
  dd.textContent = value;
  div.append(dt, dd);
  return div;
}

// Only the making charges for products in this order are shown.
function renderMaking(data) {
  const ordered = new Set(data.lines.map((l) => l.product));
  const shown = data.makingRates.filter((m) => ordered.has(m.product));
  const silver = shown.filter((m) => m.metal !== 'gold');
  const gold = shown.filter((m) => m.metal === 'gold');
  show('making-group', silver.length > 0);
  // the charge per bar/piece, with its percentage of today's value
  const shownAs = (m) => {
    if (m.percent == null && m.perUnit == null) return 'Not set';
    if (m.perUnit == null) return pct(m.percent);
    const per = `${money(m.perUnit)} per ${m.unit || 'piece'}`;
    return m.percent == null ? per : `${per} (${pct(m.percent)})`;
  };
  fill('making-rates', silver.map((m) => makingRow(m.name, shownAs(m))));
  show('gold-making-group', gold.length > 0);
  fill('gold-making-rates', gold.map((m) => makingRow(m.name, shownAs(m))));
}

function forget() {
  try { sessionStorage.removeItem('quote.price'); } catch {}
}

function stopIfBlocked() {
  const out = blockedMetals();
  if (!out.length) return false;
  forget();
  showMetalOut(out);
  return true;
}

function render(data) {
  const metals = new Set(data.lines.map((l) => l.metal));
  show('gold-group', metals.has('gold'));
  show('silver-group', metals.has('silver'));
  for (const k of RATE_KEYS) setText(k, data.rates[k] == null ? 'Not published yet' : money(data.rates[k]));
  renderMaking(data);
  renderLines($('lines'), data.lines);
  renderTotals($('totals'), data);

  if (data.missing.length) {
    const rateMissing = data.missing.some((m) => /rate$/.test(m));
    alertBox('Price not available yet', rateMissing
      ? 'Today’s gold and silver rate hasn’t been published yet. Please try again later, or call us on 01-5915052.'
      : 'Making charges for some products haven’t been set yet. Please try again later, or call us on 01-5915052.');
    forget();
    blockNext(true);
    return;
  }
  store.set('quote.price', { ...data, customerType: customer.customerType });
  blockNext(false);
}

async function calculate() {
  blockNext(true);
  try {
    const data = await postJSON('/api/quotation/price', { items, customerType: customer.customerType });
    if (data.closed) return location.reload();
    if (!data.ok && Object.values(data.errors || {}).some((m) => /out of stock/.test(m))) {
      await refreshStock();
      if (stopIfBlocked()) return;
    }
    if (!data.ok) {
      forget();
      alertBox('Couldn’t calculate the price', data.message || 'Please go back and check your products.');
      $('lines').replaceChildren();
      return;
    }
    render(data);
  } catch (err) {
    console.error(err);
    alertBox('Couldn’t calculate the price', err instanceof TypeError || err instanceof ReferenceError
      ? 'Please refresh the page and try again. If it keeps happening, call us on 01-5915052.'
      : err.message);
    $('lines').replaceChildren();
  } finally {
    $('price-card').setAttribute('aria-busy', 'false');
  }
}

if (customer) $('for-customer').textContent = `Quotation for ${customer.name}`;
onStockChange(stopIfBlocked);
if (items?.length && !stopIfBlocked()) calculate();
