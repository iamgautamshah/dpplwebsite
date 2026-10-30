/* A daily record of the published rates, kept in the RATE_CACHE KV namespace.

   One key per Nepal date, `day:YYYY-MM-DD`. The figures ride in the key's
   metadata, so the whole archive can be read with a single KV `list` call
   (no per-day reads). A day is written only when its figures change, so the
   5-minute refresh does not burn KV writes.

   Only rates that were actually published are recorded — nothing is
   back-filled or estimated. */

const PREFIX = 'day:';
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = (n) => (Number.isFinite(Number(n)) ? Number(n) : null);

function compact(p) {
  const g = p.gold;
  return {
    s: [num(p.tolaSale), num(p.tolaPurchase), num(p.g10Sale), num(p.g10Purchase)],
    g: g ? [num(g.tolaSale), num(g.tolaPurchase), num(g.g10Sale), num(g.g10Purchase)] : null,
    src: p.source === 'FENEGOSIDA' ? 'FENEGOSIDA' : 'KAGOSIDA',
  };
}

/** Record today's published figures. Safe to call on every refresh. */
export async function recordDay(env, payload) {
  const kv = env.RATE_CACHE;
  if (!kv || !payload || !DAY_RE.test(payload.dateAD || '') || !Number.isFinite(payload.tolaSale)) return;
  const key = PREFIX + payload.dateAD;
  const meta = compact(payload);
  try {
    const existing = await kv.getWithMetadata(key);
    if (existing && JSON.stringify(existing.metadata) === JSON.stringify(meta)) return;
    await kv.put(key, '1', { metadata: meta });
  } catch (err) {
    console.warn('[history] could not record', payload.dateAD, err.message);
  }
}

/** The most recent `limit` days, newest first. */
export async function readHistory(env, limit = 90) {
  const kv = env.RATE_CACHE;
  if (!kv) return [];
  const days = [];
  let cursor;
  try {
    do {
      const page = await kv.list({ prefix: PREFIX, cursor });
      for (const k of page.keys) {
        const date = k.name.slice(PREFIX.length);
        const m = k.metadata;
        if (!DAY_RE.test(date) || !m || !Array.isArray(m.s)) continue;
        days.push({ date, silver: m.s, gold: Array.isArray(m.g) ? m.g : null, source: m.src });
      }
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor);
  } catch (err) {
    console.warn('[history] could not read', err.message);
    return [];
  }
  return days.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
