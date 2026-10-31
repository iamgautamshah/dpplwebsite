import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import company from '../../public/quotation/data/company.json';
import catalog from '../../public/quotation/data/products.json';
import { addressLine, money, nepalTime, totalRows } from './format.js';

const A4 = [595.28, 841.89];
const M = 48;
const INK = rgb(0.14, 0.14, 0.12);
const MUTED = rgb(0.42, 0.4, 0.36);
const GOLD = rgb(0.6, 0.47, 0.22);
const LINE = rgb(0.86, 0.83, 0.77);
const SHADE = rgb(0.97, 0.95, 0.91);

export const NOTE = 'THIS QUOTATION IS FOR PRICE INFORMATION ONLY. FINAL PRICES ARE SUBJECT TO PREVAILING MARKET RATES AT THE TIME OF ACTUAL PURCHASE.';

const GRAMS_PER_TOLA = 11.6638;
const fmtG = (g) => `${Number(g).toLocaleString('en-IN', { maximumFractionDigits: 3 })} g`;
const productOf = (l) => catalog.metals.find((m) => m.id === l.metal)?.products.find((p) => p.id === l.product);

// Weight follows from the quantity. Quotations saved before these columns
// existed carry no weight, so it is worked out from the catalogue.
function lineWeight(l) {
  const p = productOf(l);
  const tola = l.weightTola ?? (p?.tola ? p.tola * l.quantity : null);
  const grams = l.weightGrams ?? (p ? (p.tola ? p.tola * GRAMS_PER_TOLA * l.quantity : p.grams * l.quantity) : null);
  if (tola) return `${Number(tola).toLocaleString('en-IN', { maximumFractionDigits: 3 })} tola`;
  return grams == null ? '-' : fmtG(grams);
}

// The published rate the line is priced from (per tola, or per 10 grams).
function lineRate(l) {
  const p = productOf(l);
  const value = l.rateValue ?? (p && l.unitPrice != null ? (p.tola ? l.unitPrice / p.tola : (l.unitPrice * 10) / p.grams) : null);
  return value == null ? '-' : money(value);
}

const SMART = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '·': '-', '×': 'x' };
const safe = (s) => String(s ?? '').replace(/[‘’“”–—·×]/g, (c) => SMART[c]).replace(/[^\x20-\x7E -ÿ]/g, '');

function wrap(text, font, size, width) {
  const words = safe(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function quotePdf(quote) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Quotation ${quote.number}`);
  doc.setAuthor(company.name);
  doc.setCreationDate(new Date(quote.createdAt));
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page;
  let y;
  const W = A4[0] - 2 * M;
  const text = (t, x, yy, { size = 10, font = reg, color = INK, align = 'left' } = {}) => {
    const s = safe(t);
    const w = font.widthOfTextAtSize(s, size);
    const xx = align === 'right' ? x - w : x;
    page.drawText(s, { x: xx, y: yy, size, font, color });
  };
  const rule = (yy, color = LINE, thickness = 0.75) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: A4[0] - M, y: yy }, thickness, color });

  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - M;
  };
  const ensure = (h) => {
    if (y - h < M + 30) newPage();
  };

  newPage();

  // Header: company on the left; on the right the number, a small table of the
  // day's gold and silver prices, then the date and time.
  const r = quote.rates || {};
  const fig = (n) => (n == null ? '-' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const rateRows = [
    ['Gold (999.9)', r.goldPerTola, r.goldPer10g],
    ['Silver (999)', r.silverPerTola, r.silverPer10g],
  ].filter(([, t, g]) => t != null || g != null).map(([m, t, g]) => [m, fig(t), fig(g)]);
  text(company.name, M, y - 14, { size: 16, font: bold });
  text(company.address, M, y - 30, { size: 9, color: MUTED });
  text(`Phone / WhatsApp: ${company.whatsappDisplay}   Email: ${company.email}`, M, y - 43, { size: 9, color: MUTED });
  text('QUOTATION', A4[0] - M, y - 14, { size: 16, font: bold, color: GOLD, align: 'right' });
  text(`No. ${quote.number}`, A4[0] - M, y - 30, { size: 10, font: bold, align: 'right' });
  let ry = y - 38;
  if (rateRows.length) {
    // Each column is as wide as its widest entry, so the table sizes itself to the figures.
    const SIZE = 8.5;
    const PAD = 6;
    const ROW = 14;
    const headRow = ['Rate (Rs.)', '1 tola', '10 grams'];
    const widths = headRow.map((h, k) => Math.max(bold.widthOfTextAtSize(h, SIZE), ...rateRows.map((row) => (k ? reg : bold).widthOfTextAtSize(safe(row[k]), SIZE))) + 2 * PAD);
    const tw = widths.reduce((a, b) => a + b, 0);
    const x0 = A4[0] - M - tw;
    const th = ROW * (rateRows.length + 1);
    page.drawRectangle({ x: x0, y: ry - ROW, width: tw, height: ROW, color: SHADE });
    page.drawRectangle({ x: x0, y: ry - th, width: tw, height: th, borderColor: LINE, borderWidth: 0.75 });
    [headRow, ...rateRows].forEach((row, i) => {
      const by = ry - i * ROW - 10;
      if (i > 0) page.drawLine({ start: { x: x0, y: ry - i * ROW }, end: { x: x0 + tw, y: ry - i * ROW }, thickness: 0.5, color: LINE });
      let x = x0;
      row.forEach((cell, k) => {
        const opts = { size: SIZE, font: i === 0 || k === 0 ? bold : reg, color: i === 0 ? MUTED : INK };
        if (k === 0) text(cell, x + PAD, by, opts);
        else text(cell, x + widths[k] - PAD, by, { ...opts, align: 'right' });
        x += widths[k];
      });
    });
    ry -= th + 12;
  } else {
    ry -= 5;
  }
  text(nepalTime(quote.createdAt), A4[0] - M, ry, { size: 9, color: MUTED, align: 'right' });
  y = Math.min(y - 58, ry - 15);
  rule(y, GOLD, 1.5);
  y -= 26;

  // Customer details
  const c = quote.customer;
  const business = c.customerType === 'business';
  const details = [
    ['Customer type', business ? 'Business' : 'Personal'],
    [business ? 'Registered business name' : 'Full name', c.name],
    ['PAN', c.pan],
    ...(business ? [['Contact person', c.contactPerson]] : []),
    ['Contact number', c.phone],
    ['Address', addressLine(c)],
  ];
  text('Customer details', M, y, { size: 11.5, font: bold });
  y -= 10;
  const labelW = 150;
  for (const [k, v] of details) {
    const lines = wrap(v, reg, 10, W - labelW - 16);
    const h = 10 + lines.length * 13;
    ensure(h);
    rule(y);
    text(k, M + 8, y - 15, { size: 9.5, color: MUTED });
    lines.forEach((ln, i) => text(ln, M + labelW, y - 15 - i * 13, { size: 10 }));
    y -= h + 2;
  }
  rule(y);
  y -= 30;

  // Products: product, quantity, weight (from the quantity), rate and amount
  const col = { no: M + 8, product: M + 26, qty: M + 232, weight: M + 312, rate: M + 404, amount: M + W - 8 };
  text('Products', M, y, { size: 11.5, font: bold });
  y -= 10;
  page.drawRectangle({ x: M, y: y - 22, width: W, height: 22, color: SHADE });
  const head = (t, x, align) => text(t, x, y - 15, { size: 9, font: bold, color: MUTED, align });
  head('#', col.no);
  head('Product', col.product);
  head('Quantity', col.qty, 'right');
  head('Weight', col.weight, 'right');
  head('Rate', col.rate, 'right');
  head('Amount', col.amount, 'right');
  y -= 22;

  quote.price.lines.forEach((l, i) => {
    const w = lineWeight(l);
    const rt = lineRate(l);
    const name = wrap(l.productName, reg, 10, col.qty - col.product - 52);
    const h = Math.max(26, 12 + name.length * 13);
    ensure(h);
    text(String(i + 1), col.no, y - 17, { color: MUTED });
    name.forEach((ln, k) => text(ln, col.product, y - 17 - k * 13));
    text(l.unit === 'gram' ? `${Number(l.quantity).toLocaleString('en-IN')} g` : String(l.quantity), col.qty, y - 17, { align: 'right' });
    text(w, col.weight, y - 17, { align: 'right' });
    text(rt, col.rate, y - 17, { align: 'right' });
    text(money(l.total), col.amount, y - 17, { align: 'right' });
    y -= h;
    rule(y);
  });

  y -= 6;
  for (const [label, amount] of totalRows(quote.price)) {
    ensure(20);
    text(label, col.rate, y - 14, { size: 9.5, color: MUTED, align: 'right' });
    text(money(amount), col.amount, y - 14, { size: 9.5, color: MUTED, align: 'right' });
    y -= 20;
  }
  ensure(34);
  page.drawLine({ start: { x: col.weight, y: y - 4 }, end: { x: A4[0] - M, y: y - 4 }, thickness: 1, color: INK });
  text('Total', col.rate - 28, y - 22, { size: 12, font: bold, align: 'right' });
  text(money(quote.price.total), col.amount, y - 22, { size: 12, font: bold, align: 'right' });
  y -= 46;

  // Note
  const note = wrap(NOTE, bold, 9, W - 24);
  const nh = 16 + note.length * 12;
  ensure(nh + 10);
  page.drawRectangle({ x: M, y: y - nh, width: W, height: nh, color: SHADE, borderColor: LINE, borderWidth: 0.75 });
  note.forEach((ln, k) => text(ln, M + 12, y - 18 - k * 12, { size: 9, font: bold }));

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p;
    text(`${quote.number}   Page ${i + 1} of ${pages.length}`, A4[0] - M, M - 18, { size: 8, color: MUTED, align: 'right' });
  });

  return doc.save();
}
