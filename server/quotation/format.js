export const money = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;

export const nepalTime = (iso) =>
  `${new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} NPT`;

/** Nepal date as YYYYMMDD. */
import { toBS } from '../../src/lib/nepaliDate.js';

const BS_MONTHS_LATIN = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Asoj', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

/** "Sun, 1 Nov 2026 (15 Kartik 2083 B.S.)" for a Nepal calendar day given as YYYY-MM-DD, as the price card shows it. */
export function rateDayText(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ad = new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const bs = toBS(new Date(y, mo - 1, d)); // the converter counts local-calendar days
  return bs ? `${ad} (${bs.day} ${BS_MONTHS_LATIN[bs.month]} ${bs.year} B.S.)` : ad;
}

/** Today's Nepal date as YYYY-MM-DD. */
export const nepalYMD = (iso) => nepalDate8(iso).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

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
