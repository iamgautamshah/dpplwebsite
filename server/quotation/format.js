export const money = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;

export const nepalTime = (iso) =>
  `${new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} NPT`;

/** Nepal date as YYYYMMDD. */
export function nepalDate8(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}`;
}

export function nepalDateCode(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', year: '2-digit', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}`;
}

// Identity documents a personal customer can give; business customers give their PAN.
export const ID_LABELS = { nid: 'National ID', citizenship: 'Citizenship', pan: 'PAN Number', license: 'License Number' };

/** The identity row for a customer: [label, number]. Older quotations only have a PAN. */
export const idRow = (c) => {
  const type = c.idType && ID_LABELS[c.idType] ? c.idType : 'pan';
  return [ID_LABELS[type], c.idNumber ?? c.pan];
};

export const addressLine = (c) => `${c.street}, Ward ${c.ward}, ${c.localLevel}, ${c.district}, ${c.province}`;

export const qtyText = (l) => (l.unit === 'gram' ? `${Number(l.quantity).toLocaleString('en-IN')} g` : `x ${l.quantity}`);

export function totalRows(price) {
  const rows = [];
  if (price.making || price.skillFee) rows.push(['Subtotal', price.metalTotal]);
  if (price.making) rows.push(['Making charge', price.making.amount]);
  if (price.skillFee) rows.push([`${price.skillFee.label} (${pct(price.skillFee.percent)})`, price.skillFee.amount]);
  return rows;
}
