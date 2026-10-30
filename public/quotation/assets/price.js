import { blockedMetals, onStockChange, refreshStock, showMetalOut } from './gate.js';
import { $, money, postJSON, store } from './common.js';
import { pct, renderLines, renderTotals } from './quote-table.js';

const customer = store.get('quote.customer');
const items = store.get('quote.items');
if (!customer) location.replace('/quotation');
else if (!items?.length) location.replace('/quotation/products');

const RATE_KEYS = ['goldPerTola', 'goldPerGram', 'silverPerTola', 'silverPerGram'];
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

function renderMaking(data) {
  const ordered = new Set(data.lines.filter((l) => l.metal === 'silver').map((l) => l.product));
  const shown = data.makingRates.filter((m) => ordered.has(m.product));
  $('making-group').hidden = shown.length === 0;
  $('making-rates').replaceChildren(
    ...shown.map((m) => {
      const div = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = m.name;
      const dd = document.createElement('dd');
      dd.textContent = m.percent == null ? 'Not set' : pct(m.percent);
      div.append(dt, dd);
      return div;
    }),
  );
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
  $('gold-group').hidden = !metals.has('gold');
  $('silver-group').hidden = !metals.has('silver');
  for (const k of RATE_KEYS) $(k).textContent = data.rates[k] == null ? 'Not set' : money(data.rates[k]);
  renderMaking(data);
  renderLines($('lines'), data.lines);
  renderTotals($('totals'), data);

  if (data.missing.length) {
    alertBox('Price not available yet', `The following ${data.missing.length > 1 ? 'rates haven’t' : 'rate hasn’t'} been set: ${data.missing.join(', ')}. Please contact us or try again later.`);
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
    alertBox('Couldn’t calculate the price', err.message);
    $('lines').replaceChildren();
  } finally {
    $('price-card').setAttribute('aria-busy', 'false');
  }
}

if (customer) $('for-customer').textContent = `Quotation for ${customer.name}`;
onStockChange(stopIfBlocked);
if (items?.length && !stopIfBlocked()) calculate();
