export const $ = (id) => document.getElementById(id);

export const API_MISSING = 'The quotation service isn’t available right now. Please try again shortly, or call us on 01-5915052.';

export const store = {
  get(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
  },
  set(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

export function setError(field, message) {
  const input = $(field);
  const slot = $(`${field}-error`);
  if (slot) slot.textContent = message || '';
  if (input) message ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid');
}

export function clearOnInput(input) {
  const handler = () => input.getAttribute('aria-invalid') && setError(input.id);
  input.addEventListener('input', handler);
  input.addEventListener('change', handler);
}

function labelFor(field) {
  const label = document.querySelector(`label[for="${field}"]`);
  if (!label) return '';
  const clone = label.cloneNode(true);
  clone.querySelectorAll('.req, .unit').forEach((n) => n.remove());
  return clone.textContent.trim();
}

export function showErrors(summary, errors, fields) {
  fields.forEach((f) => setError(f, errors[f]));
  const keys = Object.keys(errors);
  summary.querySelector('ul').replaceChildren(
    ...keys.map((k) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${k}`;
      const label = $(k) ? labelFor(k) : '';
      a.textContent = label ? `${label}: ${errors[k]}` : errors[k];
      a.addEventListener('click', (e) => {
        e.preventDefault();
        $(k)?.focus();
      });
      li.append(a);
      return li;
    }),
  );
  summary.hidden = keys.length === 0;
  if (keys.length) summary.focus();
}

export async function postJSON(url, body) {
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error(location.protocol === 'file:' ? API_MISSING : 'Couldn’t reach the server. Check your connection and try again.');
  }
  if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error(API_MISSING);
  return res.json();
}

export async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn’t load ${url}`);
  return res.json();
}

export const money = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const nepalTime = (iso) =>
  `${new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} NPT`;

export function fillSelect(select, items, placeholder, { disabled = false } = {}) {
  select.replaceChildren(new Option(placeholder, ''), ...items.map((i) => new Option(i.name, i.id)));
  select.disabled = disabled;
}
