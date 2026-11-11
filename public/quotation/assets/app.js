import { onStockChange, stock } from './gate.js?v=20261111a';
import { $, API_MISSING, clearOnInput, fillSelect, getJSON, postJSON, setError, showErrors, store } from './common.js?v=20261111a';

const form = $('quote-form');
const el = {
  type: $('customerType'),
  idType: $('idType'),
  idTypeField: $('idType-field'),
  idNumber: $('idNumber'),
  idLabel: $('idNumber-label'),
  idHint: $('idNumber-hint'),
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
const LATIN_MSG = 'Use English letters only, as on your ID document.';
// What each ID looks like. Personal customers pick one; businesses always give their PAN.
const IDS = {
  nid: { label: 'National ID number', hint: 'The 10-digit National Identity Number (NIN) on your National ID card.', placeholder: '10-digit NIN', numeric: true, digits: 10, empty: 'Enter your National ID number.', wrong: 'National ID number must be exactly 10 digits.' },
  citizenship: { label: 'Citizenship number', hint: 'As printed on your citizenship certificate, e.g. 27-01-71-05432.', placeholder: 'e.g. 27-01-71-05432', empty: 'Enter your citizenship number.' },
  pan: { label: 'PAN number', hint: 'The 9-digit number on your PAN certificate.', placeholder: '9-digit PAN', numeric: true, digits: 9, empty: 'Enter your PAN number.', wrong: 'PAN must be exactly 9 digits.' },
  license: { label: 'License number', hint: 'As printed on your driving licence, e.g. 01-06-00012345.', placeholder: 'e.g. 01-06-00012345', empty: 'Enter your license number.' },
};
const DOC_RE = /^(?=.*\d)[A-Za-z0-9][A-Za-z0-9 \-\/]{1,29}$/;
const FIELDS = ['customerType', 'name', 'idType', 'idNumber', 'contactPerson', 'phone', 'province', 'district', 'localLevel', 'ward', 'street'];
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
  el.nameHint.textContent = business ? 'As registered with the Inland Revenue Department.' : 'As it appears on your ID document.';
  el.name.autocomplete = business ? 'organization' : 'name';
  el.idTypeField.hidden = business;
  el.idType.disabled = business;
  if (business) setError('idType');
  syncIdType();
}

const currentIdType = () => (isBusiness() ? 'pan' : el.idType.value);

function syncIdType() {
  const id = IDS[currentIdType()];
  el.idLabel.textContent = id ? id.label : 'ID number';
  el.idHint.textContent = id ? id.hint : 'Choose an ID type first.';
  el.idNumber.placeholder = id ? id.placeholder : '';
  el.idNumber.inputMode = id?.numeric ? 'numeric' : 'text';
  if (id?.numeric) digitsOnly(el.idNumber, id.digits);
}

function idError() {
  const type = currentIdType();
  const v = el.idNumber.value.trim();
  const id = IDS[type];
  if (!id) return null; // the ID type error covers it
  if (!v) return id.empty;
  if (id.digits && v.length !== id.digits) return id.wrong;
  if (!id.digits && !DOC_RE.test(v)) return 'Use English digits, letters, hyphens or slashes, as printed.';
  return null;
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
  if (c.customerType !== 'business') el.idType.value = c.idType || (c.pan ? 'pan' : '');
  syncIdType();
  el.idNumber.value = c.idNumber ?? c.pan ?? '';
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
  if (el.type.value && !isBusiness() && !el.idType.value) errors.idType = 'Choose an ID type.';
  const idErr = el.type.value ? idError() : null;
  if (idErr) errors.idNumber = idErr;
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

el.idType.addEventListener('change', () => {
  syncIdType();
  setError('idType');
  if (el.idNumber.value) setError('idNumber', idError());
});
el.idNumber.addEventListener('input', () => {
  const id = IDS[currentIdType()];
  if (id?.numeric) digitsOnly(el.idNumber, id.digits);
});
el.phone.addEventListener('input', () => {
  const raw = el.phone.value.replace(/\D/g, '');
  el.phone.value = (raw.length > 10 && raw.startsWith('977') ? raw.slice(3) : raw).slice(0, 10);
});
el.idNumber.addEventListener('blur', () => {
  if (el.idNumber.value) setError('idNumber', idError());
});
el.phone.addEventListener('blur', () => {
  if (el.phone.value && el.phone.value.length < 10) setError('phone', `Contact number must be exactly 10 digits (you entered ${el.phone.value.length}).`);
});

el.province.addEventListener('change', onProvince);
el.district.addEventListener('change', onDistrict);
el.localLevel.addEventListener('change', onLocalLevel);

['idNumber', 'name', 'contactPerson', 'phone', 'province', 'district', 'localLevel', 'ward', 'street'].forEach((id) => clearOnInput($(id)));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errors = validate();
  showErrors(el.summary, errors, FIELDS);
  if (Object.keys(errors).length) return;

  setBusy(true);
  try {
    const data = await postJSON('/api/quotation/customer', {
      customerType: el.type.value,
      idType: currentIdType(),
      idNumber: el.idNumber.value,
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
