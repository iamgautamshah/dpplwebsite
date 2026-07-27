const BS_REF = new Date(2023, 3, 14);
const BS_START_YEAR = 2080;

const BS_DATA = [
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2080
  [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2081
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2082
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2083
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2084
  [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2085
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2086
  [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30], // 2087
  [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2088
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2089
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2090
];

export const NP_MONTHS = [
  'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
];

export const NP_DAYS = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार',
];

const NP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toNepaliDigits = (n) =>
  String(n).replace(/\d/g, (d) => NP_DIGITS[d]);

export function toBS(date) {
  let days = Math.floor((date - BS_REF) / 864e5);
  if (days < 0) return null;
  let y = 0;
  while (y < BS_DATA.length) {
    const yearLen = BS_DATA[y].reduce((a, b) => a + b, 0);
    if (days < yearLen) break;
    days -= yearLen;
    y++;
  }
  if (y >= BS_DATA.length) return null;
  let m = 0;
  while (days >= BS_DATA[y][m]) {
    days -= BS_DATA[y][m];
    m++;
  }
  return { year: BS_START_YEAR + y, month: m, day: days + 1 };
}

export function formatBS(date) {
  const bs = toBS(date);
  if (!bs) return '—';
  return `${NP_DAYS[date.getDay()]}, ${toNepaliDigits(bs.day)} ${NP_MONTHS[bs.month]} ${toNepaliDigits(bs.year)}`;
}

export function formatAD(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
