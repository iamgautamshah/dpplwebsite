import { money } from './common.js';

export const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
const grams = (n) => `${Number(n).toLocaleString('en-IN')} g`;

function row(cells, cls) {
  const tr = document.createElement('tr');
  if (cls) tr.className = cls;
  cells.forEach(([text, c]) => {
    const td = document.createElement('td');
    if (c) td.className = c;
    td.textContent = text;
    tr.append(td);
  });
  return tr;
}

export function renderLines(tbody, lines) {
  tbody.replaceChildren(
    ...lines.map((l) =>
      row([
        [l.productName],
        [l.unitPrice == null ? '—' : l.unit === 'gram' ? `${money(l.unitPrice)}/g` : money(l.unitPrice), 'num'],
        [l.unit === 'gram' ? grams(l.quantity) : `× ${l.quantity}`, 'num'],
        [l.total == null ? '—' : money(l.total), 'num'],
      ]),
    ),
  );
}

export function renderTotals(tfoot, data) {
  const out = [];
  const sub = (label, amount) => out.push(row([[label], [''], [''], [money(amount), 'num']], 'sub'));
  if (data.making || data.skillFee) sub('Subtotal', data.metalTotal);
  if (data.making) sub('Making charge', data.making.amount);
  if (data.skillFee) sub(`${data.skillFee.label} (${pct(data.skillFee.percent)})`, data.skillFee.amount);
  const grand = row([['Total'], [''], [''], [data.total == null ? '—' : money(data.total), 'num']], 'grand');
  grand.lastElementChild.id = 'total';
  out.push(grand);
  tfoot.replaceChildren(...out);
}
