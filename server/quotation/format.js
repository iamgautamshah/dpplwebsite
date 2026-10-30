export const money = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;

export const nepalTime = (iso) =>
  `${new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} NPT`;

export function nepalDateCode(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', year: '2-digit', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}`;
}

export const addressLine = (c) => `${c.street}, Ward ${c.ward}, ${c.localLevel}, ${c.district}, ${c.province}`;

export const qtyText = (l) => (l.unit === 'gram' ? `${Number(l.quantity).toLocaleString('en-IN')} g` : `x ${l.quantity}`);

// "Making charge - Gold 10 gram (Rs. 1,500.00 x 2)" or "Making charge - Silver 100 gram (2%)"
export function makingLabel(m, sep = ' · ') {
  const name = `${m.metalName ? `${m.metalName} ` : ''}${m.productName}`;
  const how = m.flat != null ? `${money(m.flat)} x ${Number(m.quantity).toLocaleString('en-IN')}` : pct(m.percent);
  return `Making charge${sep}${name} (${how})`;
}

export function totalRows(price) {
  const rows = [];
  if (price.making || price.skillFee) rows.push(['Subtotal', price.metalTotal]);
  for (const m of price.making?.lines ?? []) rows.push([makingLabel(m, ' - '), m.amount]);
  if (price.skillFee) rows.push([`${price.skillFee.label} (${pct(price.skillFee.percent)})`, price.skillFee.amount]);
  return rows;
}
