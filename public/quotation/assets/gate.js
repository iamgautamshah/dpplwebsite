// Loaded first by every customer page. Checks stock on load and then every few seconds, so a
// customer part-way through a quotation sees the sorry message as soon as the admin switches a metal off.
const FALLBACK = { gold: true, silver: true, out: [], open: true, message: null };
const POLL_MS = 10000;
const METAL_NAMES = { gold: 'Gold', silver: 'Silver' };
const listeners = [];
let view = 'normal'; // normal | closed | metal-out

async function fetchStatus() {
  try {
    const res = await fetch('/api/quotation/status', { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export const stock = { ...((await fetchStatus()) ?? FALLBACK) };

const icon = '<svg aria-hidden="true" viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 13v14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="34" r="2.2" fill="currentColor"/></svg>';

function sorryCard(title, message, action) {
  const card = document.createElement('section');
  card.className = 'card closed';
  card.setAttribute('role', 'alert');
  card.innerHTML = `${icon}<h2></h2><p></p>`;
  card.querySelector('h2').textContent = title;
  card.querySelector('p').textContent = message;
  if (action) {
    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = action.href;
    a.textContent = action.label;
    card.append(a);
  }
  return card;
}

function clearSession() {
  try {
    for (const k of ['quote.customer', 'quote.items', 'quote.price', 'quote.saved']) sessionStorage.removeItem(k);
  } catch {}
}

function showClosed(message) {
  view = 'closed';
  document.title = 'Out of stock';
  const card = sorryCard('We’re out of stock', message);
  card.querySelector('h2').outerHTML = '<h1>We’re out of stock</h1>';
  document.querySelector('main').replaceChildren(card);
  clearSession();
}

function orderItems() {
  try {
    return JSON.parse(sessionStorage.getItem('quote.items') || 'null') ?? [];
  } catch {
    return [];
  }
}

// What in the customer's saved order is now out of stock: a whole metal
// ("gold"), or single products ("Gold Bar - 5g (999.9)").
export function blockedMetals(s = stock) {
  const items = orderItems();
  const metals = [...new Set(items.map((i) => i.metal))].filter((m) => s[m] === false);
  const products = items.filter((i) => !metals.includes(i.metal) && (s.out ?? []).includes(i.product)).map((i) => i.productName);
  return [...metals.map((m) => (METAL_NAMES[m] ?? m).toLowerCase()), ...new Set(products)];
}

// Used by the Price and Review pages: replace the quotation with a sorry message.
export function showMetalOut(names) {
  view = 'metal-out';
  const what = names.join(' and ');
  const card = document.querySelector('main > .card');
  const sorry = sorryCard(
    'Sorry, out of stock',
    `Sorry for the inconvenience, but ${what} ${names.length > 1 ? 'are' : 'is'} now out of stock, so we can’t prepare this quotation. Please change your products or check back soon. Thank you.`,
    { href: '/quotation/products', label: 'Change products' },
  );
  if (card) card.replaceWith(sorry);
  else document.querySelector('main').append(sorry);
}

export const refreshStock = () => recheck(true);

export function onStockChange(fn) {
  listeners.push(fn);
}

if (!stock.open) {
  showClosed(stock.message);
  await new Promise(() => {});
}

let checking = false;
async function recheck(force = false) {
  if (checking || (document.hidden && !force)) return;
  checking = true;
  const next = await fetchStatus();
  checking = false;
  if (!next) return;
  if (view === 'closed') {
    if (next.open) location.reload();
    return;
  }
  if (!next.open) return showClosed(next.message);
  const changed = next.gold !== stock.gold || next.silver !== stock.silver || (next.out ?? []).join() !== (stock.out ?? []).join();
  Object.assign(stock, next);
  if (view === 'metal-out' && !blockedMetals().length) return location.reload();
  if (changed) listeners.forEach((fn) => fn(stock));
}

setInterval(recheck, POLL_MS);
document.addEventListener('visibilitychange', recheck);
window.addEventListener('focus', recheck);
