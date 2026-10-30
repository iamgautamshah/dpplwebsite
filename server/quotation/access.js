/* Where the admin may run, and the Cloudflare Access check in front of it.

   The quotation admin is deployed with the rest of the site, and Cloudflare
   Pages serves one deployment on every hostname attached to the project —
   dppl.com.np, www, admin and the *.pages.dev addresses. So the admin cannot
   rely on DNS for isolation: every admin page and API checks the hostname and
   answers 404 anywhere except the admin hostname(s).

   ADMIN_HOSTS (optional, comma separated) overrides the default
   admin.dppl.com.np — for local development it is set to admin.localhost.

   Cloudflare Access sits in front of admin.dppl.com.np at the edge. When
   ACCESS_TEAM_DOMAIN and ACCESS_AUD are set, the admin also verifies the
   signed token Access attaches to every request (Cf-Access-Jwt-Assertion),
   so even a request that somehow skipped the edge policy is refused. */

const DEFAULT_ADMIN_HOSTS = ['admin.dppl.com.np'];

export function adminHosts(env) {
  const list = String(env.ADMIN_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ADMIN_HOSTS;
}

export const isAdminHost = (env, url) => adminHosts(env).includes(new URL(url).hostname.toLowerCase());

export const isAdminPath = (pathname) =>
  pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/api/admin' || pathname.startsWith('/api/admin/');

const b64urlBytes = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

let certCache = { team: null, keys: null, at: 0 };

async function accessKeys(team) {
  if (certCache.team === team && certCache.keys && Date.now() - certCache.at < 3600_000) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs request failed (${res.status})`);
  const { keys } = await res.json();
  certCache = { team, keys, at: Date.now() };
  return keys;
}

export const accessConfigured = (env) => Boolean(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD);

/** { ok, email } — ok is true when Access is not configured. */
export async function verifyAccess(env, request) {
  if (!accessConfigured(env)) return { ok: true, email: null, configured: false };
  const team = String(env.ACCESS_TEAM_DOMAIN).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return { ok: false, reason: 'no Access token' };
  try {
    const [h, p, s] = token.split('.');
    const header = b64urlJson(h);
    const claims = b64urlJson(p);
    if (header.alg !== 'RS256') return { ok: false, reason: 'unexpected algorithm' };
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const now = Math.floor(Date.now() / 1000);
    if (!aud.includes(env.ACCESS_AUD)) return { ok: false, reason: 'wrong audience' };
    if (claims.iss !== `https://${team}`) return { ok: false, reason: 'wrong issuer' };
    if (!claims.exp || claims.exp < now - 30) return { ok: false, reason: 'token expired' };
    if (claims.nbf && claims.nbf > now + 30) return { ok: false, reason: 'token not yet valid' };

    const jwk = (await accessKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: 'unknown signing key' };
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
    return valid ? { ok: true, email: claims.email || null, configured: true } : { ok: false, reason: 'bad signature' };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}
