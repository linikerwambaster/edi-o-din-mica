/* Site principal + páginas das frentes: rastreamento (Pixel + API de Conversões), topo, menu e animações ao rolar.
   Configuração em window.SITE = { pixelId, capi, pagina } definida em cada página. */
(function () {
  "use strict";
  var C = window.SITE || {};
  var doc = document.documentElement;
  doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- rastreamento (mesmo event_id no Pixel e na API = sem contar em dobro) ---------- */
  var cookie = function (n) { var m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; };
  var busca = new URLSearchParams(location.search);
  var fbclid = busca.get("fbclid");
  if (fbclid && !cookie("_fbc")) document.cookie = "_fbc=fb.1." + Date.now() + "." + fbclid + "; path=/; max-age=7776000; SameSite=Lax";
  var utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(function (k) { var v = busca.get(k); if (v) utm[k] = v; });
  if (Object.keys(utm).length) { try { localStorage.setItem("lp_utm", JSON.stringify(utm)); } catch (e) {} }

  var pixelOn = false;
  if (C.pixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", C.pixelId); pixelOn = true;
  }
  var enviar = function (nome, dados) {
    var id = nome + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    dados = dados || {};
    if (pixelOn) fbq("track", nome, dados, { eventID: id });
    if (!C.capi || !C.pixelId) return;
    var corpo = JSON.stringify({ event_name: nome, event_id: id, event_source_url: location.href, fbp: cookie("_fbp"), fbc: cookie("_fbc"), custom_data: dados });
    try { navigator.sendBeacon ? navigator.sendBeacon(C.capi, new Blob([corpo], { type: "text/plain;charset=UTF-8" }))
                               : fetch(C.capi, { method: "POST", body: corpo, keepalive: true }); } catch (e) {}
  };
  window.siteEvento = enviar;
  enviar("PageView");
  if (C.pagina) enviar("ViewContent", { content_name: C.pagina, content_category: "site" });
  // conversa (direct do Instagram / WhatsApp) = Contact; material grátis = Lead
  $$("[data-evento]").forEach(function (a) {
    a.addEventListener("click", function () { enviar(a.getAttribute("data-evento"), { content_name: a.getAttribute("data-origem") || C.pagina || "site" }); });
  });

  /* ---------- topo e menu ---------- */
  var topo = $(".topo");
  var ajustaTopo = function () { if (topo) topo.classList.toggle("rolou", window.scrollY > 30); };
  ajustaTopo(); window.addEventListener("scroll", ajustaTopo, { passive: true });
  var burger = $(".burger"), menu = $(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () { var a = menu.classList.toggle("aberto"); burger.setAttribute("aria-expanded", a ? "true" : "false"); burger.textContent = a ? "×" : "☰"; });
    $$("a", menu).forEach(function (l) { l.addEventListener("click", function () { menu.classList.remove("aberto"); burger.textContent = "☰"; }); });
  }

  /* ---------- aparecer ao rolar ---------- */
  var alvos = $$(".sobe, .caminho, .fase, .frente, [data-anima]");
  if (!("IntersectionObserver" in window) || reduz) { alvos.forEach(function (el) { el.classList.add("dentro"); }); }
  else {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add("dentro"); it.target.dispatchEvent(new CustomEvent("dentro")); io.unobserve(it.target); } });
    }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* ---------- chat do WhatsApp que se escreve sozinho (página n8n) ---------- */
  var chat = $("#chat");
  if (chat) {
    var msgs = $$(".msg", chat), dig = $(".digitando", chat), rodando = false;
    var roda = function () {
      if (rodando) return; rodando = true;
      var i = 0;
      var prox = function () {
        if (i >= msgs.length) { setTimeout(function () { msgs.forEach(function (m) { m.classList.remove("ver"); }); i = 0; setTimeout(prox, 900); }, 5200); return; }
        var m = msgs[i];
        if (m.classList.contains("ia") && dig) {
          chat.insertBefore(dig, m); dig.classList.add("ver");
          setTimeout(function () { dig.classList.remove("ver"); m.classList.add("ver"); i++; setTimeout(prox, 900); }, 1300);
        } else { m.classList.add("ver"); i++; setTimeout(prox, 1100); }
      };
      prox();
    };
    if (reduz) msgs.forEach(function (m) { m.classList.add("ver"); });
    else { var p = chat.closest("[data-anima]") || chat; p.addEventListener("dentro", roda); if (p.classList.contains("dentro")) roda(); }
  }

  /* ---------- fluxo n8n: os nós acendem conforme o pacote passa ---------- */
  var fluxo = $("#fluxo");
  if (fluxo && !reduz) {
    var nos = $$(".no", fluxo), k = 0;
    setInterval(function () { nos.forEach(function (n, j) { n.classList.toggle("on", j === k); }); k = (k + 1) % nos.length; }, 900);
  }
})();
