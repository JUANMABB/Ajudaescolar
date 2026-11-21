/* Ajudaescolar · peces comunes del taller
   - Progreso: qué retos están hechos. Se guarda solo en este iPad (localStorage), sin datos personales.
   - Selector de número grande (stepper).
   - Mensajes amables, con frases que van cambiando. */
(function(){
  var KEY = "taller-progres-v1";
  function all(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } }
  function store(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }

  var Taller = {
    done: function(game, id){ var o = all(); return !!(o[game] && o[game][id]); },
    markDone: function(game, id){ var o = all(); o[game] = o[game] || {}; o[game][id] = 1; store(o); },
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

    reducedMotion: function(){ return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  };
  window.Taller = Taller;

  if ("serviceWorker" in navigator) { navigator.serviceWorker.register("../sw.js").catch(function(){}); }
})();
