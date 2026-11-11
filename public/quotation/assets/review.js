import { blockedMetals, onStockChange, refreshStock, showMetalOut } from './gate.js?v=20261111a';
import { $, getJSON, money, postJSON, store } from './common.js?v=20261111a';
import { renderLines, renderTotals } from './quote-table.js?v=20261111a';

const customer = store.get('quote.customer');
const items = store.get('quote.items');
let price = store.get('quote.price');
const sameItems = price && price.customerType === customer?.customerType && JSON.stringify(price.lines.map((l) => [l.product, l.quantity])) === JSON.stringify((items || []).map((i) => [i.product, i.quantity]));

if (!customer) location.replace('/quotation');
else if (!items?.length) location.replace('/quotation/products');
else if (!sameItems || price.total == null) location.replace('/quotation/price');

const quoteKey = () => JSON.stringify({ customer, items, total: price?.total });
let company = { whatsappDisplay: 'us' };
let busy = false;

function alertBox(title, text) {
  const box = $('alert');
  const strong = document.createElement('strong');
  strong.textContent = title;
  box.replaceChildren(strong, document.createTextNode(text));
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function status(text, ok = true) {
  const el = $('status');
  el.textContent = text;
  el.className = `status-msg ${ok ? 'ok' : 'err'}`;
  el.hidden = !text;
}

const ID_LABELS = { nid: 'National ID', citizenship: 'Citizenship', pan: 'PAN Number', license: 'License Number' };
const idRow = (c) => [ID_LABELS[c.idType] || ID_LABELS.pan, c.idNumber ?? c.pan];

function renderCustomer() {
  const business = customer.customerType === 'business';
  const rows = [
    ['Customer type', business ? 'Business' : 'Personal'],
    [business ? 'Registered business name' : 'Full name', customer.name],
    idRow(customer),
    ...(business ? [['Contact person', customer.contactPerson]] : []),
    ['Contact number', customer.phone],
    ['Address', `${customer.street}, Ward ${customer.ward}, ${customer.localLevel}, ${customer.district}, ${customer.province}`],
  ];
  $('customer').replaceChildren(
    ...rows.map(([k, v]) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = k;
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(th, td);
      return tr;
    }),
  );
}

function renderPrice() {
  renderLines($('lines'), price.lines);
  renderTotals($('totals'), price);
}

function stopIfBlocked() {
  const out = blockedMetals();
  if (!out.length) return false;
  showMetalOut(out);
  return true;
}

function savedQuote() {
  const s = store.get('quote.saved');
  return s && s.key === quoteKey() ? s : null;
}

async function ensureQuote() {
  const existing = savedQuote();
  if (existing) return existing;
  const data = await postJSON('/api/quotation/quotes', { customer, items });
  if (data.closed) {
    location.reload();
    return null;
  }
  if (!data.ok && data.step === 'products') {
    await refreshStock();
    if (stopIfBlocked()) return null;
  }
  if (!data.ok) {
    alertBox('Couldn’t prepare your quotation', data.message || 'Please try again.');
    return null;
  }
  if (Math.abs(data.price.total - price.total) >= 0.01) {
    price = { ...price, ...data.price };
    store.set('quote.price', price);
    renderPrice();
    alertBox('Prices have been updated', `Today’s rates changed since you calculated. Your new total is ${money(price.total)}. Please check it, then send again.`);
    return null;
  }
  const saved = { key: quoteKey(), id: data.id, number: data.number, pdfUrl: data.pdfUrl, whatsappUrl: data.whatsappUrl };
  store.set('quote.saved', saved);
  return saved;
}

async function run(button, label, action) {
  if (busy) return;
  busy = true;
  const span = button.querySelector('span');
  const original = span.textContent;
  button.disabled = true;
  span.textContent = label;
  $('alert').hidden = true;
  try {
    await action();
  } catch (err) {
    alertBox('Something went wrong', err.message);
  } finally {
    busy = false;
    button.disabled = false;
    span.textContent = original;
  }
}

$('send-whatsapp').addEventListener('click', () => {
  const win = window.open('', '_blank');
  run($('send-whatsapp'), 'Opening WhatsApp…', async () => {
    const q = await ensureQuote();
    if (!q) return win?.close();
    if (win) win.location.href = q.whatsappUrl;
    else location.href = q.whatsappUrl;
    status(`WhatsApp is opening with quotation ${q.number} for ${company.whatsappDisplay}. Press send in WhatsApp to deliver it.`);
  }).catch(() => win?.close());
});

$('download').addEventListener('click', () =>
  run($('download'), 'Preparing…', async () => {
    const q = await ensureQuote();
    if (!q) return;
    const a = document.createElement('a');
    a.href = q.pdfUrl;
    a.download = `Quotation-${q.number.replace(/[\\/]/g, '-')}.pdf`;
    document.body.append(a);
    a.click();
    a.remove();
  }),
);

onStockChange(stopIfBlocked);
if (customer && items?.length && sameItems && !stopIfBlocked()) {
  renderCustomer();
  renderPrice();
  try {
    company = await getJSON('/quotation/data/company.json');
    $('send-intro').textContent = `Send this quotation as a PDF to ${company.name} on WhatsApp (${company.whatsappDisplay}), or download a copy.`;
  } catch {
    $('send-intro').textContent = 'Send this quotation as a PDF on WhatsApp, or download a copy.';
  }
}
