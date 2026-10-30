import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import company from '../../public/quotation/data/company.json';
import { addressLine, money, nepalTime, qtyText, totalRows } from './format.js';

const A4 = [595.28, 841.89];
const M = 48;
const INK = rgb(0.14, 0.14, 0.12);
const MUTED = rgb(0.42, 0.4, 0.36);
const GOLD = rgb(0.6, 0.47, 0.22);
const LINE = rgb(0.86, 0.83, 0.77);
const SHADE = rgb(0.97, 0.95, 0.91);

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

  // Header
  text(company.name, M, y - 14, { size: 16, font: bold });
  text(company.address, M, y - 30, { size: 9, color: MUTED });
  text(`Phone / WhatsApp: ${company.whatsappDisplay}   Email: ${company.email}`, M, y - 43, { size: 9, color: MUTED });
  text('QUOTATION', A4[0] - M, y - 14, { size: 16, font: bold, color: GOLD, align: 'right' });
  text(`No. ${quote.number}`, A4[0] - M, y - 30, { size: 9.5, align: 'right' });
  text(nepalTime(quote.createdAt), A4[0] - M, y - 43, { size: 9, color: MUTED, align: 'right' });
  y -= 58;
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

  // Products
  const col = { no: M + 8, product: M + 32, unit: M + W - 200, qty: M + W - 110, amount: M + W - 8 };
  text('Products', M, y, { size: 11.5, font: bold });
  y -= 10;
  page.drawRectangle({ x: M, y: y - 22, width: W, height: 22, color: SHADE });
  const head = (t, x, align) => text(t, x, y - 15, { size: 9, font: bold, color: MUTED, align });
  head('#', col.no);
  head('Product', col.product);
  head('Unit price', col.unit, 'right');
  head('Qty', col.qty, 'right');
  head('Amount', col.amount, 'right');
  y -= 22;

  quote.price.lines.forEach((l, i) => {
    ensure(26);
    const unit = l.unit === 'gram' ? `${money(l.unitPrice)}/g` : money(l.unitPrice);
    text(String(i + 1), col.no, y - 17, { color: MUTED });
    text(l.productName, col.product, y - 17);
    text(unit, col.unit, y - 17, { align: 'right' });
    text(qtyText(l), col.qty, y - 17, { align: 'right' });
    text(money(l.total), col.amount, y - 17, { align: 'right' });
    y -= 26;
    rule(y);
  });

  y -= 6;
  for (const [label, amount] of totalRows(quote.price)) {
    ensure(20);
    text(label, col.qty, y - 14, { size: 9.5, color: MUTED, align: 'right' });
    text(money(amount), col.amount, y - 14, { size: 9.5, color: MUTED, align: 'right' });
    y -= 20;
  }
  ensure(34);
  page.drawLine({ start: { x: col.unit - 60, y: y - 4 }, end: { x: A4[0] - M, y: y - 4 }, thickness: 1, color: INK });
  text('Total', col.qty, y - 22, { size: 12, font: bold, align: 'right' });
  text(money(quote.price.total), col.amount, y - 22, { size: 12, font: bold, align: 'right' });
  y -= 46;

  ensure(40);
  page.drawRectangle({ x: M, y: y - 30, width: W, height: 30, color: SHADE, borderColor: LINE, borderWidth: 0.75 });
  text('Quotation only.', M + 12, y - 19, { size: 9.5, font: bold });
  text('This is not a booking, order confirmation or invoice.', M + 12 + bold.widthOfTextAtSize('Quotation only. ', 9.5), y - 19, { size: 9.5 });

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p;
    text(`${quote.number}   Page ${i + 1} of ${pages.length}`, A4[0] - M, M - 18, { size: 8, color: MUTED, align: 'right' });
  });

  return doc.save();
}
