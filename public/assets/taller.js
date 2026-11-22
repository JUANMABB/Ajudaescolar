/* Ajudaescolar · peces comunes del taller
   - Progreso: qué retos están hechos. Se guarda solo en este iPad (localStorage), sin datos personales.
   - Selector de número grande (stepper).
   - Mensajes amables, con frases que van cambiando. */
(function(){
  var KEY = "taller-progres-v1";
  function all(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } }
  function store(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }

  // ---- Registre silenciós per als pares (vegeu src/worker.js). El nen no en veu res. ----
  var QK = "taller-cua-v1", DK = "taller-dispositiu", cur = null, timer = null;
  function devId(){
    try {
      var d = localStorage.getItem(DK);
      if (!d){ d = Array.from(crypto.getRandomValues(new Uint8Array(8)), function(b){ return b.toString(16).padStart(2, "0"); }).join(""); localStorage.setItem(DK, d); }
      return d;
    } catch(e){ return "sensedada"; }
  }
  function queue(){ try { return JSON.parse(localStorage.getItem(QK) || "[]"); } catch(e){ return []; } }
  function saveQueue(q){ try { localStorage.setItem(QK, JSON.stringify(q.slice(-500))); } catch(e){} }
  function rid(){ return Array.from(crypto.getRandomValues(new Uint8Array(8)), function(b){ return b.toString(16).padStart(2, "0"); }).join(""); }
  function push(ev){ ev.uid = rid(); var q = queue(); q.push(ev); saveQueue(q); clearTimeout(timer); timer = setTimeout(flush, 400); }
  function flush(beacon){
    var q = queue(); if (!q.length) return;
    var body = JSON.stringify(q);
    // En sortir de la pàgina: s'envia, però la cua es queda fins que un enviament normal ho confirmi
    // (si arriba dues vegades, el servidor ignora el repetit pel uid)
    if (beacon && navigator.sendBeacon){ navigator.sendBeacon("/api/event", new Blob([body], { type:"application/json" })); return; }
    if (navigator.onLine === false) return;
    fetch("/api/event", { method:"POST", headers:{ "content-type":"application/json" }, body:body, keepalive:true })
      .then(function(r){ if (r.ok){ var sent = {}; q.forEach(function(e){ sent[e.uid] = 1; }); saveQueue(queue().filter(function(e){ return !sent[e.uid]; })); } })
      .catch(function(){});
  }
  function event(type, extra){
    if (!cur || cur.sent) return;
    push({ type:type, game:cur.game, ch:cur.id, dev:devId(), ts:new Date().toISOString(), tries:cur.tries, hints:cur.hints, ms:Date.now() - cur.t0, extra:extra || null });
    if (type !== "round") cur.sent = true;
  }
  function maybeAbandon(){ if (cur && !cur.sent && (cur.tries > 0 || cur.hints > 0 || Date.now() - cur.t0 > 20000)) event("abandon"); }
  addEventListener("pagehide", function(){ maybeAbandon(); flush(true); });
  addEventListener("online", function(){ flush(); });
  // Un sol cop: envia també el que ja s'havia fet abans que existís el registre
  try {
    if (!localStorage.getItem("taller-migrat-v1")){
      var prev = JSON.parse(localStorage.getItem("taller-progres-v1") || "{}"), dv = devId();
      Object.keys(prev).forEach(function(g){ Object.keys(prev[g]).forEach(function(id){
        var v = prev[g][id], ts = typeof v === "string" ? v : new Date().toISOString();
        push({ type:"done", game:g, ch:id, dev:dv, ts:ts, tries:null, hints:null, ms:null, extra:{ anterior:true } });
      }); });
      localStorage.setItem("taller-migrat-v1", "1");
    }
  } catch(e){}
  setTimeout(flush, 2000);

  var Taller = {
    // Començar un repte, un intent fallit, una pista, una ronda acabada (sense desar progrés)
    begin: function(game, id){ maybeAbandon(); cur = { game:game, id:id, t0:Date.now(), tries:0, hints:0, sent:false }; },
    tried: function(){ if (cur && !cur.sent) cur.tries++; },
    hinted: function(){ if (cur && !cur.sent) cur.hints++; },
    round: function(extra){ if (cur && !cur.sent){ event("round", extra); cur.t0 = Date.now(); cur.tries = 0; cur.hints = 0; } },

    done: function(game, id){ var o = all(); return !!(o[game] && o[game][id]); },
    // Guarda la data del primer cop que es fa (abans es guardava un 1: també compta com a fet)
    markDone: function(game, id, extra){
      var o = all(); o[game] = o[game] || {}; if (!o[game][id]) { o[game][id] = new Date().toISOString(); store(o); }
      if (cur && cur.game === game && cur.id === id) event("done", extra);
    },
    all: all,
    countDone: function(game, ids){ var n = 0; ids.forEach(function(id){ if (Taller.done(game, id)) n++; }); return n; },

    // Selector de número: devuelve {get, set}
    stepper: function(el, opt){
      opt = opt || {};
      var min = opt.min == null ? 0 : opt.min, max = opt.max == null ? 99 : opt.max, step = opt.step || 1;
      var val = opt.value == null ? min : opt.value;
      el.className = "stepper"; el.innerHTML = "";
      var minus = document.createElement("button"); minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", "Menys");
      var out = document.createElement("output"); out.setAttribute("aria-live", "polite");
      var plus = document.createElement("button"); plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", "Més");
      el.appendChild(minus); el.appendChild(out); el.appendChild(plus);
      function draw(){ out.textContent = val + (opt.unit || ""); if (opt.onChange) opt.onChange(val); }
      // Mantener pulsado para ir más rápido
      function hold(btn, d){
        var t1, t2;
        function go(){ val = Math.max(min, Math.min(max, val + d)); draw(); }
        btn.addEventListener("click", function(e){ if (btn._held) { btn._held = false; return; } go(); });
        btn.addEventListener("pointerdown", function(){ btn._held = false; t1 = setTimeout(function(){ btn._held = true; t2 = setInterval(go, 110); }, 450); });
        ["pointerup","pointerleave","pointercancel"].forEach(function(ev){ btn.addEventListener(ev, function(){ clearTimeout(t1); clearInterval(t2); }); });
      }
      hold(minus, -step); hold(plus, step);
      draw();
      return { get: function(){ return val; }, set: function(v){ val = v; draw(); } };
    },

    praise: function(){
      var p = ["Molt bé!", "Ho has descobert!", "Exacte!", "Fantàstic!", "Ben pensat!", "Així és!"];
      return p[Math.floor(Math.random() * p.length)];
    },

    msg: function(el, text, kind){
      el.className = "msg" + (kind ? " " + kind : "");
      el.textContent = text || "";
    },

    dots: function(el, total, current, isDone){
      el.innerHTML = "";
      for (var i = 0; i < total; i++){
        var s = document.createElement("span");
        if (isDone(i)) s.className = "ok"; else if (i === current) s.className = "now";
        el.appendChild(s);
      }
      el.setAttribute("aria-label", "Repte " + (current + 1) + " de " + total);
    },

    // Targetes de nivell. levels: [{name, desc, ch:[...]}]; pick(nivell, primer repte no fet)
    levelCards: function(box, game, levels, pick){
      box.innerHTML = "";
      levels.forEach(function(L, i){
        var ids = L.ch.map(function(_, c){ return "L" + i + "-" + c; });
        var n = Taller.countDone(game, ids);
        var b = document.createElement("button"); b.type = "button"; b.className = "level";
        b.innerHTML = '<span class="n">Nivell ' + (i + 1) + '</span><span class="t"></span><span class="d"></span><span class="done"></span>';
        b.querySelector(".t").textContent = L.name;
        b.querySelector(".d").textContent = L.desc;
        b.querySelector(".done").textContent = L.free ? "Lliure" : (n === ids.length ? "Fet!" : (n ? n + " de " + ids.length + " reptes" : ids.length + " reptes"));
        b.addEventListener("click", function(){
          var first = 0;
          for (var c = 0; c < ids.length; c++){ if (!Taller.done(game, ids[c])) { first = c; break; } }
          pick(i, first);
        });
        box.appendChild(b);
      });
    },

    reducedMotion: function(){ return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  };
  window.Taller = Taller;

  if ("serviceWorker" in navigator) { navigator.serviceWorker.register("../sw.js").catch(function(){}); }
})();
