import { onStockChange, stock } from './gate.js?v=20261031e';
import { $, API_MISSING, clearOnInput, fillSelect, getJSON, postJSON, setError, showErrors, store } from './common.js?v=20261031e';

const form = $('quote-form');
const el = {
  type: $('customerType'),
  pan: $('pan'),
  name: $('name'),
  nameLabel: $('name-label'),
  nameHint: $('name-hint'),
  contactField: $('contactPerson-field'),
  contact: $('contactPerson'),
  phone: $('phone'),
  province: $('province'),
  district: $('district'),
  localLevel: $('localLevel'),
  ward: $('ward'),
  street: $('street'),
  next: $('next'),
  summary: $('error-summary'),
};

const LATIN_RE = /^[A-Za-z0-9\u00C0-\u00FF .,'&()\-\/#:]+$/;
const LATIN_MSG = 'Use English letters only, as on your PAN certificate.';
const FIELDS = ['customerType', 'name', 'pan', 'contactPerson', 'phone', 'province', 'district', 'localLevel', 'ward', 'street'];
let geo = null;

const isBusiness = () => el.type.value === 'business';
const digitsOnly = (input, max) => {
  const v = input.value.replace(/\D/g, '').slice(0, max);
  if (v !== input.value) input.value = v;
};

function syncCustomerType() {
  const business = isBusiness();
  el.contactField.hidden = !business;
  el.contact.disabled = !business;
  el.contact.required = business;
  if (!business) setError('contactPerson');
  el.nameLabel.textContent = business ? 'Registered business name' : 'Full name';
  el.nameHint.textContent = business ? 'As registered with the Inland Revenue Department.' : 'As it appears on your PAN registration.';
  el.name.autocomplete = business ? 'organization' : 'name';
}

function onProvince() {
  const id = Number(el.province.value);
  const districts = id ? geo.districts.filter((d) => d.provinceId === id) : [];
  fillSelect(el.district, districts, id ? 'Select district' : 'Select a province first', { disabled: !id });
  onDistrict();
}

function onDistrict() {
  const id = Number(el.district.value);
  const locals = id ? geo.localLevels.filter((l) => l.districtId === id) : [];
  fillSelect(el.localLevel, locals, id ? 'Select municipality / rural municipality' : 'Select a district first', { disabled: !id });
  onLocalLevel();
}

function onLocalLevel() {
  const local = geo.localLevels.find((l) => l.id === Number(el.localLevel.value));
  const wards = local ? Array.from({ length: local.wards }, (_, i) => ({ id: i + 1, name: `Ward ${i + 1}` })) : [];
  fillSelect(el.ward, wards, local ? 'Select ward' : 'Select a municipality first', { disabled: !local });
}

async function loadGeo() {
  try {
    geo = await getJSON('/quotation/data/nepal-address.json');
    fillSelect(el.province, geo.provinces, 'Select province');
  } catch {
    fillSelect(el.province, [], 'Unavailable', { disabled: true });
    $('geo-error').textContent = location.protocol === 'file:' ? API_MISSING : 'Couldn’t load the address list. Refresh the page to try again.';
  }
}

function restore() {
  const c = store.get('quote.customer');
  if (!c) return;
  el.type.value = c.customerType;
  syncCustomerType();
  el.pan.value = c.pan;
  el.name.value = c.name;
  el.contact.value = c.contactPerson || '';
  el.phone.value = c.phone;
  el.street.value = c.street;
  if (!geo) return;
  el.province.value = c.provinceId;
  onProvince();
  el.district.value = c.districtId;
  onDistrict();
  el.localLevel.value = c.localLevelId;
  onLocalLevel();
  el.ward.value = c.ward;
}

function validate() {
  const errors = {};
  if (!el.type.value) errors.customerType = 'Choose Personal or Business.';
  if (el.name.value.trim().length < 2) errors.name = isBusiness() ? 'Enter the registered business name.' : 'Enter your full name.';
  else if (!LATIN_RE.test(el.name.value.trim())) errors.name = LATIN_MSG;
  if (!el.pan.value) errors.pan = 'Enter your PAN number.';
  else if (!/^\d{9}$/.test(el.pan.value)) errors.pan = 'PAN must be exactly 9 digits.';
  if (isBusiness() && el.contact.value.trim().length < 2) errors.contactPerson = 'Enter the name of the contact person.';
  else if (isBusiness() && !LATIN_RE.test(el.contact.value.trim())) errors.contactPerson = LATIN_MSG;
  if (!el.phone.value) errors.phone = 'Enter a contact number.';
  else if (!/^\d{10}$/.test(el.phone.value)) errors.phone = `Contact number must be exactly 10 digits (you entered ${el.phone.value.length}).`;
  if (!el.province.value) errors.province = 'Select a province.';
  else if (!el.district.value) errors.district = 'Select a district.';
  else if (!el.localLevel.value) errors.localLevel = 'Select a municipality or rural municipality.';
  else if (!el.ward.value) errors.ward = 'Select a ward.';
  if (el.street.value.trim().length < 2) errors.street = 'Enter your street or tole.';
  else if (!LATIN_RE.test(el.street.value.trim())) errors.street = 'Use English letters only.';
  return errors;
}

function setBusy(busy) {
  el.next.disabled = busy;
  el.next.querySelector('span').textContent = busy ? 'Saving…' : 'Continue to product selection';
}

el.type.addEventListener('change', () => {
  syncCustomerType();
  setError('customerType');
});

el.pan.addEventListener('input', () => digitsOnly(el.pan, 9));
el.phone.addEventListener('input', () => {
  const raw = el.phone.value.replace(/\D/g, '');
  el.phone.value = (raw.length > 10 && raw.startsWith('977') ? raw.slice(3) : raw).slice(0, 10);
});
el.pan.addEventListener('blur', () => {
  if (el.pan.value && el.pan.value.length < 9) setError('pan', 'PAN must be exactly 9 digits.');
});
el.phone.addEventListener('blur', () => {
  if (el.phone.value && el.phone.value.length < 10) setError('phone', `Contact number must be exactly 10 digits (you entered ${el.phone.value.length}).`);
});

el.province.addEventListener('change', onProvince);
el.district.addEventListener('change', onDistrict);
el.localLevel.addEventListener('change', onLocalLevel);

['pan', 'name', 'contactPerson', 'phone', 'province', 'district', 'localLevel', 'ward', 'street'].forEach((id) => clearOnInput($(id)));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errors = validate();
  showErrors(el.summary, errors, FIELDS);
  if (Object.keys(errors).length) return;

  setBusy(true);
  try {
    const data = await postJSON('/api/quotation/customer', {
      customerType: el.type.value,
      pan: el.pan.value,
      name: el.name.value,
      contactPerson: isBusiness() ? el.contact.value : undefined,
      phone: el.phone.value,
      provinceId: el.province.value,
      districtId: el.district.value,
      localLevelId: el.localLevel.value,
      ward: el.ward.value,
      street: el.street.value,
    });
    if (data.ok) {
      store.set('quote.customer', data.customer);
      location.href = '/quotation/products';
      return;
    }
    if (data.closed) return location.reload();
    showErrors(el.summary, data.errors || { form: 'Something went wrong. Please try again.' }, FIELDS);
  } catch (err) {
    showErrors(el.summary, { form: err.message }, FIELDS);
  }
  setBusy(false);
});

function stockNotice() {
  const out = ['gold', 'silver'].filter((m) => stock[m] === false);
  const box = $('stock-notice');
  box.hidden = !out.length;
  box.textContent = out.length === 1
    ? `Sorry, ${out[0]} is currently out of stock. You can still request a quotation for ${out[0] === 'gold' ? 'silver' : 'gold'}.`
    : '';
}

stockNotice();
onStockChange(stockNotice);
syncCustomerType();
await loadGeo();
restore();
