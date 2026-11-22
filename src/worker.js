// Ajudaescolar · Worker
// - Sirve la web estática (carpeta public/) como siempre.
// - /api/*: guarda en silencio el registro de los retos del taller y lo enseña a los padres con una clave.
// Privacidad: no se guarda nombre, IP ni nada personal. Solo un identificador aleatorio del iPad
// y datos del juego (qué reto, intentos, pistas, tiempo).
import { DurableObject } from "cloudflare:workers";

const GAMES = /^[a-z]{2,20}$/, IDS = /^[A-Za-z0-9_-]{1,40}$/, TYPES = ["done", "round", "abandon"];
const json = (o, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" }
});

async function sha256(text){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Limpia un evento: solo campos conocidos, con límites
function clean(e){
  if (!e || typeof e !== "object") return null;
  const n = (v, max) => Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : null;
  if (!TYPES.includes(e.type) || !GAMES.test(e.game || "") || !IDS.test(e.ch || "") || !IDS.test(e.dev || "")) return null;
  const ts = typeof e.ts === "string" && !isNaN(Date.parse(e.ts)) ? new Date(e.ts).toISOString() : new Date().toISOString();
  let extra = null;
  if (e.extra && typeof e.extra === "object"){
    const s = JSON.stringify(e.extra);
    if (s.length <= 300) extra = s;
  }
  const uid = IDS.test(e.uid || "") ? e.uid : null;
  return { uid, ts, dev:e.dev, type:e.type, game:e.game, ch:e.ch, tries:n(e.tries, 999), hints:n(e.hints, 99), ms:n(e.ms, 6 * 3600 * 1000), extra };
}

export class Registre extends DurableObject {
  constructor(ctx, env){
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS ev(
      id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT UNIQUE, ts TEXT, dev TEXT, type TEXT, game TEXT, ch TEXT,
      tries INTEGER, hints INTEGER, ms INTEGER, extra TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS cfg(k TEXT PRIMARY KEY, v TEXT)`);
  }
  add(list){
    let n = 0;
    for (const e of list){
      // uid repetit = el mateix esdeveniment enviat dues vegades: s'ignora
      this.sql.exec("INSERT OR IGNORE INTO ev(uid,ts,dev,type,game,ch,tries,hints,ms,extra) VALUES (?,?,?,?,?,?,?,?,?,?)",
        e.uid, e.ts, e.dev, e.type, e.game, e.ch, e.tries, e.hints, e.ms, e.extra);
      n++;
    }
    return n;
  }
  list(after){
    return this.sql.exec("SELECT id,ts,dev,type,game,ch,tries,hints,ms,extra FROM ev WHERE id > ? ORDER BY id LIMIT 20000", after || 0).toArray();
  }
  keyHash(){ const r = this.sql.exec("SELECT v FROM cfg WHERE k='key'").toArray(); return r.length ? r[0].v : null; }
  claim(hash){
    if (this.keyHash()) return false;
    this.sql.exec("INSERT INTO cfg(k,v) VALUES ('key', ?)", hash);
    return true;
  }
}

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const reg = env.REGISTRE.get(env.REGISTRE.idFromName("taller"));

    // El iPad envía eventos (sin clave: solo se puede añadir, nunca leer)
    if (url.pathname === "/api/event" && request.method === "POST"){
      const text = await request.text();
      if (text.length > 50000) return json({ ok:false }, 413);
      let body; try { body = JSON.parse(text); } catch { return json({ ok:false }, 400); }
      const list = (Array.isArray(body) ? body : [body]).slice(0, 200).map(clean).filter(Boolean);
      const n = list.length ? await reg.add(list) : 0;
      return json({ ok:true, n });
    }

    // Los padres: crear la clave la primera vez y leer los eventos con ella
    if (url.pathname === "/api/claim" && request.method === "POST"){
      let body; try { body = await request.json(); } catch { return json({ ok:false }, 400); }
      if (typeof body.key !== "string" || body.key.length < 16) return json({ ok:false, error:"clave corta" }, 400);
      const ok = await reg.claim(await sha256(body.key));
      return json({ ok }, ok ? 200 : 409);
    }
    if (url.pathname === "/api/events" && request.method === "GET"){
      const key = request.headers.get("x-clave") || "";
      const stored = await reg.keyHash();
      if (!stored) return json({ ok:false, error:"sin clave" }, 404);
      if (!key || await sha256(key) !== stored) return json({ ok:false, error:"clave incorrecta" }, 403);
      const after = parseInt(url.searchParams.get("after") || "0", 10) || 0;
      return json({ ok:true, events: await reg.list(after) });
    }
    return json({ ok:false }, 404);
  }
};
