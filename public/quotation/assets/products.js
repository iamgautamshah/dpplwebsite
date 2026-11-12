import { onStockChange, stock } from './gate.js?v=20261112a';
import { $, clearOnInput, fillSelect, getJSON, postJSON, setError, showErrors, store } from './common.js?v=20261112a';

const customer = store.get('quote.customer');
if (!customer) location.replace('/quotation');
const customerType = customer?.customerType;
const allowed = (p) => !p.customerTypes || p.customerTypes.includes(customerType);

const LIMITS = { piece: 999, gram: 100000 };
const UNIT_LABEL = { piece: '(pieces)', gram: '(grams)' };

const form = $('items-form');
const list = $('items');
const template = $('item-template');
const summary = $('error-summary');
const next = $('next');
let catalog = null;

$('for-customer').textContent = customer ? `Quotation for ${customer.name}` : '';

const rows = () => [...list.querySelectorAll('.item')];
const field = (row, name) => row.querySelector(`[data-field="${name}"]`);
const productOut = (p) => (stock.out ?? []).includes(p.id);
// a metal is offered when it is switched on and has a product this customer can have in stock
const inStock = (m) => stock[m.id] !== false && m.products.some((p) => allowed(p) && !productOut(p));
const outOfStock = (name) => `Sorry, ${name.toLowerCase()} is currently out of stock.`;
const productName = (metal, p) => `${p.name} (${metal.fineness})`;
const productOutMsg = (name) => `Sorry, ${name} is currently out of stock. Choose another product.`;
const metalOf = (row) => catalog.metals.filter(inStock).find((m) => m.id === field(row, 'metal').value);
const productOf = (row) => {
  const p = metalOf(row)?.products.find((x) => x.id === field(row, 'product').value);
  return p && !productOut(p) ? p : undefined;
};

// Out-of-stock products stay in the list, greyed out and marked, so customers can see them.
function fillProducts(select, metal) {
  const opts = (metal?.products ?? []).filter(allowed).map((p) => {
    const out = productOut(p);
    const o = new Option(`${productName(metal, p)}${out ? ' — out of stock' : ''}`, p.id);
    o.disabled = out;
    return o;
  });
  select.replaceChildren(new Option(metal ? `Select ${metal.name.toLowerCase()} product` : 'Select a metal first', ''), ...opts);
  select.disabled = !metal;
}

function renumber() {
  const all = rows();
  all.forEach((row, i) => {
    row.querySelector('.item-title').textContent = `Item ${i + 1}`;
    row.querySelectorAll('.item-prefix').forEach((s) => (s.textContent = `Item ${i + 1} `));
    for (const name of ['metal', 'product', 'quantity']) {
      const id = `item-${i}-${name}`;
      const input = field(row, name);
      input.id = id;
      input.setAttribute('aria-describedby', `${id}-error`);
      row.querySelector(`[data-for="${name}"]`).htmlFor = id;
      row.querySelector(`[data-error="${name}"]`).id = `${id}-error`;
    }
    row.querySelector('.btn-remove').hidden = all.length === 1;
    row.querySelector('.btn-remove').setAttribute('aria-label', `Remove item ${i + 1}`);
  });
}

function syncUnit(row) {
  const unit = productOf(row)?.unit ?? 'piece';
  row.querySelector('.unit').textContent = UNIT_LABEL[unit];
  field(row, 'quantity').maxLength = String(LIMITS[unit]).length;
}

function onMetal(row) {
  const metal = metalOf(row);
  // customers see the product with its fineness, e.g. "Gold Bar - 10g (999.9)"
  fillProducts(field(row, 'product'), metal);
  syncUnit(row);
}

function addRow(item) {
  const row = template.content.firstElementChild.cloneNode(true);
  list.append(row);
  fillSelect(field(row, 'metal'), catalog.metals.filter(inStock), 'Select metal');
  onMetal(row);
  let removedProduct = null;
  let removedMetal = null;
  let soldOut = null;
  const savedMetal = item && catalog.metals.find((m) => m.id === item.metal);
  if (item && (!savedMetal || !inStock(savedMetal))) removedMetal = item.metalName;
  else if (item) {
    field(row, 'metal').value = item.metal;
    onMetal(row);
    const p = savedMetal.products.find((x) => x.id === item.product);
    if (p && productOut(p)) {
      soldOut = item.productName;
      row.dataset.productWas = p.id;
    }
    else {
      field(row, 'product').value = item.product;
      if (field(row, 'product').value !== item.product) removedProduct = item.productName;
      else field(row, 'quantity').value = item.quantity;
    }
    syncUnit(row);
  }

  field(row, 'metal').addEventListener('change', () => {
    delete row.dataset.metalRestricted;
    delete row.dataset.metalWas;
    delete row.dataset.productWas;
    delete row.dataset.restricted;
    onMetal(row);
  });
  field(row, 'product').addEventListener('change', () => {
    delete row.dataset.restricted;
    delete row.dataset.productWas;
    syncUnit(row);
  });
  field(row, 'quantity').addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (v !== e.target.value) e.target.value = v;
  });
  ['metal', 'product', 'quantity'].forEach((n) => clearOnInput(field(row, n)));
  row.querySelector('.btn-remove').addEventListener('click', () => {
    const index = rows().indexOf(row);
    row.remove();
    renumber();
    field(rows()[Math.max(0, index - 1)], 'metal').focus();
  });
  renumber();
  if (removedMetal) {
    row.dataset.metalWas = item.metal;
    row.dataset.metalRestricted = `${outOfStock(removedMetal)} Choose another product.`;
    setError(field(row, 'metal').id, row.dataset.metalRestricted);
  }
  if (soldOut) {
    row.dataset.restricted = productOutMsg(soldOut);
    setError(field(row, 'product').id, row.dataset.restricted);
  }
  if (removedProduct) {
    row.dataset.restricted = `${removedProduct} ${removedProduct.endsWith('s') ? 'are' : 'is'} available for business customers only. Choose another product.`;
    setError(field(row, 'product').id, row.dataset.restricted);
  }
  return row;
}

function stockNotice() {
  const out = catalog.metals.filter((m) => !inStock(m)).map((m) => m.name);
  const products = catalog.metals.filter(inStock).flatMap((m) => m.products.filter((p) => allowed(p) && productOut(p)).map((p) => productName(m, p)));
  const parts = [];
  if (out.length) parts.push(`${outOfStock(out.join(' and '))} You can still request a quotation for ${catalog.metals.filter(inStock).map((m) => m.name.toLowerCase()).join(' and ')}.`);
  if (products.length) parts.push(`Currently out of stock: ${products.join(', ')}.`);
  $('stock-notice').hidden = !parts.length;
  $('stock-notice').textContent = parts.join(' ');
}

// Called when the admin changes availability while this page is open.
function applyStock() {
  stockNotice();
  for (const row of rows()) {
    const select = field(row, 'metal');
    const wanted = select.value || row.dataset.metalWas || '';
    fillSelect(select, catalog.metals.filter(inStock), 'Select metal');
    const metal = catalog.metals.find((m) => m.id === wanted);
    if (metal && inStock(metal)) {
      const product = field(row, 'product').value || row.dataset.productWas || '';
      select.value = wanted;
      if (row.dataset.metalWas) {
        delete row.dataset.metalWas;
        delete row.dataset.metalRestricted;
        setError(select.id);
        onMetal(row);
      } else {
        fillProducts(field(row, 'product'), metal);
        const p = metal.products.find((x) => x.id === product);
        if (p && productOut(p)) {
          row.dataset.productWas = p.id;
          row.dataset.restricted = productOutMsg(productName(metal, p));
          setError(field(row, 'product').id, row.dataset.restricted);
        } else {
          field(row, 'product').value = product;
          if (row.dataset.productWas) {
            delete row.dataset.productWas;
            delete row.dataset.restricted;
            setError(field(row, 'product').id);
          }
        }
        syncUnit(row);
      }
    } else if (metal) {
      row.dataset.metalWas = metal.id;
      row.dataset.metalRestricted = `${outOfStock(metal.name)} Choose another product.`;
      onMetal(row);
      setError(select.id, row.dataset.metalRestricted);
    }
  }
}

function collect() {
  return rows().map((row) => ({
    metal: field(row, 'metal').value,
    product: field(row, 'product').value,
    quantity: field(row, 'quantity').value,
  }));
}

function validate() {
  const errors = {};
  rows().forEach((row, i) => {
    const product = productOf(row);
    const qty = Number(field(row, 'quantity').value);
    if (!metalOf(row)) errors[`item-${i}-metal`] = row.dataset.metalRestricted || (catalog.metals.every(inStock) ? 'Choose Gold or Silver.' : 'Choose a metal.');
    else if (!product) errors[`item-${i}-product`] = row.dataset.restricted || 'Choose a product.';
    else if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS[product.unit]) {
      errors[`item-${i}-quantity`] = product.unit === 'gram'
        ? `Enter a weight between 1 and ${LIMITS.gram.toLocaleString('en-IN')} grams.`
        : `Enter a quantity between 1 and ${LIMITS.piece}.`;
    }
  });
  return errors;
}

const allFields = () => rows().flatMap((_, i) => ['metal', 'product', 'quantity'].map((n) => `item-${i}-${n}`));

function setBusy(busy) {
  next.disabled = busy;
  next.querySelector('span').textContent = busy ? 'Calculating…' : 'Calculate price';
}

$('add-item').addEventListener('click', () => field(addRow(), 'metal').focus());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errors = validate();
  showErrors(summary, errors, allFields());
  if (Object.keys(errors).length) return;

  setBusy(true);
  try {
    const data = await postJSON('/api/quotation/items', { items: collect(), customerType });
    if (data.ok) {
      store.set('quote.items', data.items);
      location.href = '/quotation/price';
      return;
    }
    if (data.closed) return location.reload();
    showErrors(summary, data.errors || { form: 'Something went wrong. Please try again.' }, allFields());
  } catch (err) {
    showErrors(summary, { form: err.message }, allFields());
  }
  setBusy(false);
});

try {
  catalog = await getJSON('/quotation/data/products.json');
  stockNotice();
  onStockChange(applyStock);
  const saved = store.get('quote.items');
  saved?.length ? saved.forEach(addRow) : addRow();
} catch {
  $('catalog-error').textContent = 'Couldn’t load the product list. Refresh the page to try again.';
  $('add-item').disabled = true;
  next.disabled = true;
}
