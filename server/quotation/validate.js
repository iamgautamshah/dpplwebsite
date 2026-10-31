import geo from '../../public/quotation/data/nepal-address.json';
import catalog from '../../public/quotation/data/products.json';

export const PAN_RE = /^\d{9}$/;
export const PHONE_RE = /^\d{10}$/;
export const QTY_LIMITS = { piece: 999, gram: 100000 };

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const text = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export function resolveAddress({ provinceId, districtId, localLevelId, ward }) {
  const errors = {};
  const province = geo.provinces.find((p) => p.id === Number(provinceId));
  const district = province && geo.districts.find((d) => d.id === Number(districtId) && d.provinceId === province.id);
  const local = district && geo.localLevels.find((l) => l.id === Number(localLevelId) && l.districtId === district.id);
  const wardNo = Number(ward);

  if (!province) errors.province = 'Select a province.';
  else if (!district) errors.district = 'Select a district.';
  else if (!local) errors.localLevel = 'Select a municipality or rural municipality.';
  else if (!Number.isInteger(wardNo) || wardNo < 1 || wardNo > local.wards) errors.ward = 'Select a ward.';

  if (Object.keys(errors).length) return { errors };
  return {
    address: {
      provinceId: province.id,
      province: province.name,
      districtId: district.id,
      district: district.name,
      localLevelId: local.id,
      localLevel: local.name,
      ward: wardNo,
    },
  };
}

// Names and street go on the PDF, which uses a Latin font: accept English letters and common punctuation.
export const LATIN_RE = /^[A-Za-z0-9\u00C0-\u00FF .,'&()\-\/#:]+$/;
const latinOnly = 'Use English letters only, as on your PAN certificate.';

export function validateCustomer(body) {
  const errors = {};
  const customerType = body?.customerType;
  if (!CUSTOMER_TYPES.includes(customerType)) errors.customerType = 'Choose Personal or Business.';
  const business = customerType === 'business';

  const pan = String(body?.pan ?? '').trim();
  if (!PAN_RE.test(pan)) errors.pan = 'PAN must be exactly 9 digits.';

  const name = text(body?.name, 120);
  if (name.length < 2) errors.name = business ? 'Enter the registered business name.' : 'Enter your full name.';
  else if (!LATIN_RE.test(name)) errors.name = latinOnly;

  const contactPerson = business ? text(body?.contactPerson, 80) : null;
  if (business && contactPerson.length < 2) errors.contactPerson = 'Enter the name of the contact person.';
  else if (business && !LATIN_RE.test(contactPerson)) errors.contactPerson = latinOnly;

  const phone = String(body?.phone ?? '').trim();
  if (!PHONE_RE.test(phone)) errors.phone = 'Contact number must be exactly 10 digits.';

  const { address, errors: addressErrors } = resolveAddress(body ?? {});
  Object.assign(errors, addressErrors);

  const street = text(body?.street, 120);
  if (street.length < 2) errors.street = 'Enter your street or tole.';
  else if (!LATIN_RE.test(street)) errors.street = 'Use English letters only.';

  if (Object.keys(errors).length) return { errors };
  return { errors, customer: { customerType, pan, name, contactPerson, phone, ...address, street } };
}

// What customers see: the product and its fineness, e.g. "Gold Bar - 10g (999.9)".
export const displayName = (metal, product) => `${product.name} (${metal.fineness})`;

export function findProduct(metalId, productId) {
  const metal = catalog.metals.find((m) => m.id === metalId);
  const product = metal?.products.find((p) => p.id === productId);
  return { metal, product };
}

export const CUSTOMER_TYPES = ['personal', 'business'];
export const allowedFor = (product, customerType) => !product.customerTypes || product.customerTypes.includes(customerType);
export const restrictionMessage = (product) => `${product.name} ${product.name.endsWith('s') ? 'are' : 'is'} available for business customers only.`;

export function validateItems(input, customerType, stock = { gold: true, silver: true }) {
  const rows = Array.isArray(input) ? input.slice(0, 20) : [];
  const errors = {};
  const items = [];
  if (!CUSTOMER_TYPES.includes(customerType)) errors.customerType = 'Customer type is missing. Go back to customer details.';
  if (!rows.length) errors.items = 'Add at least one product.';

  rows.forEach((row, i) => {
    const { metal, product } = findProduct(row?.metal, row?.product);
    const qty = Number(row?.quantity);
    if (!metal) errors[`item-${i}-metal`] = 'Choose Gold or Silver.';
    else if (stock[metal.id] === false) errors[`item-${i}-metal`] = `Sorry, ${metal.name.toLowerCase()} is currently out of stock.`;
    else if (!product) errors[`item-${i}-product`] = 'Choose a product.';
    else if (CUSTOMER_TYPES.includes(customerType) && !allowedFor(product, customerType)) errors[`item-${i}-product`] = restrictionMessage(product);
    else if (!Number.isInteger(qty) || qty < 1 || qty > QTY_LIMITS[product.unit]) {
      errors[`item-${i}-quantity`] = product.unit === 'gram'
        ? `Enter a weight between 1 and ${QTY_LIMITS.gram.toLocaleString('en-IN')} grams.`
        : `Enter a quantity between 1 and ${QTY_LIMITS.piece}.`;
    } else {
      items.push({ metal: metal.id, metalName: metal.name, product: product.id, productName: displayName(metal, product), unit: product.unit, quantity: qty });
    }
  });
  return { items, errors };
}
