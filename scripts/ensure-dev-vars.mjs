// Creates .dev.vars for local testing with `npm run dev:full`.
// It holds a random local admin password and session secret; .dev.vars is
// git-ignored and is never deployed. Production values are set as encrypted
// secrets in the Cloudflare dashboard instead.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const FILE = '.dev.vars';
const vars = existsSync(FILE)
  ? Object.fromEntries(readFileSync(FILE, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  : {};

let changed = false;
if (!vars.ADMIN_PASSWORD || vars.ADMIN_PASSWORD.length < 12) {
  vars.ADMIN_PASSWORD = randomBytes(12).toString('base64url');
  changed = true;
}
if (!vars.SESSION_SECRET || vars.SESSION_SECRET.length < 32) {
  vars.SESSION_SECRET = randomBytes(32).toString('hex');
  changed = true;
}
if (!vars.ADMIN_HOSTS) {
  vars.ADMIN_HOSTS = 'admin.localhost';
  changed = true;
}

if (changed) {
  writeFileSync(FILE, Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  console.log(`\n  Local admin password: ${vars.ADMIN_PASSWORD}  (saved in .dev.vars)\n  Admin page:      http://admin.localhost:8788/\n  Quotation form:  http://localhost:8788/quotation\n`);
}
