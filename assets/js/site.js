/* LP Skill Edição Dinâmica: animações + rastreamento.
   Configuração fica no index.html (window.LP_CONFIG). */
(function () {
  "use strict";
  var C = window.LP_CONFIG || {};
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =====================================================================
     RASTREAMENTO: Pixel + API de Conversões (mesmo event_id = sem duplicar)
     ===================================================================== */
  var CHAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck", "xcod", "fbclid"];
  var guardado = {};
  try { guardado = JSON.parse(localStorage.getItem("lp_utm") || "{}") || {}; } catch (e) { guardado = {}; }
  var busca = new URLSearchParams(location.search);
  var atuais = {};
  CHAVES_UTM.forEach(function (k) { var v = busca.get(k); if (v) atuais[k] = v; });
  // primeiro toque fica guardado; um clique novo de anúncio substitui
  if (Object.keys(atuais).length) { guardado = atuais; try { localStorage.setItem("lp_utm", JSON.stringify(guardado)); } catch (e) {} }

  var cookie = function (n) { var m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; };
  var fbclid = atuais.fbclid || guardado.fbclid || "";
  if (fbclid && !cookie("_fbc")) {
    document.cookie = "_fbc=fb.1." + Date.now() + "." + fbclid + "; path=/; max-age=7776000; SameSite=Lax";
  }

  var pixelOn = false;
  if (C.pixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", C.pixelId);
    pixelOn = true;
  }
  var enviar = function (nome, dados, personalizado) {
    var id = nome + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    dados = dados || {};
    if (pixelOn) fbq(personalizado ? "trackCustom" : "track", nome, dados, { eventID: id });
    if (C.capi && C.pixelId) {
      var corpo = JSON.stringify({ event_name: nome, event_id: id, event_source_url: location.href, fbp: cookie("_fbp"), fbc: cookie("_fbc"), custom_data: dados });
      try {
        if (navigator.sendBeacon) navigator.sendBeacon(C.capi, new Blob([corpo], { type: "text/plain;charset=UTF-8" }));
        else fetch(C.capi, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: corpo, keepalive: true });
      } catch (e) {}
    }
  };
  enviar("PageView");

  /* preço em todos os lugares */
  $$(".preco-v").forEach(function (el) { el.textContent = C.preco || "97"; });

  /* botões de compra: checkout com UTMs + InitiateCheckout */
  var linkCheckout = function () {
    if (!C.checkout) return "";
    var u;
    try { u = new URL(C.checkout); } catch (e) { return C.checkout; }
    Object.keys(guardado).forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, guardado[k]); });
    return u.toString();
  };
  $$(".comprar").forEach(function (a) {
    var url = linkCheckout();
    if (url) a.href = url;
    a.addEventListener("click", function (ev) {
      if (!url) {
        if (a.getAttribute("href") === "#oferta" && a.closest("#oferta")) ev.preventDefault();
        if (!$("#aviso-checkout")) {
          var t = document.createElement("div");
          t.className = "aviso"; t.id = "aviso-checkout";
          t.textContent = "Prévia: o link do checkout entra aqui quando estiver pronto.";
          document.body.appendChild(t);
          setTimeout(function () { t.remove(); }, 3200);
        }
        return;
      }
      enviar("InitiateCheckout", { value: Number(C.preco || 97), currency: "BRL", content_name: "Skill Edição Dinâmica", content_category: a.dataset.local || "" });
    });
  });

  /* =====================================================================
     VSL: começa sem som; o toque reinicia com som. Mede 25/50/75/95%.
     ===================================================================== */
  var player = $("#player"), vsl = $("#vsl"), ouvir = $("#ouvir");
  var marcos = [25, 50, 75, 95], feitos = {};
  var registraProgresso = function (pct) {
    marcos.forEach(function (m) { if (pct >= m && !feitos[m]) { feitos[m] = 1; enviar("VSL_" + m, { porcentagem: m }, true); } });
  };
  if (C.vslEmbed) {
    player.innerHTML = C.vslEmbed;
    // players externos que avisam o tempo por mensagem (formato varia por player)
    window.addEventListener("message", function (ev) {
      var d = ev.data;
      if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return; } }
      if (!d || typeof d !== "object") return;
      var x = d.data && typeof d.data === "object" ? d.data : d;
      var t = Number(x.currentTime || x.seconds || 0), dur = Number(x.duration || 0);
      if (dur > 0 && t > 0) registraProgresso((t / dur) * 100);
    });
  } else if (vsl) {
    if (C.vslArquivo) { var src = vsl.querySelector("source"); if (src && src.getAttribute("src") !== C.vslArquivo) { src.setAttribute("src", C.vslArquivo); vsl.load(); } }
    var comSom = false;
    ouvir.addEventListener("click", function () {
      vsl.currentTime = 0; vsl.muted = false; vsl.controls = true;
      vsl.play().catch(function () {});
      ouvir.hidden = true; comSom = true;
      enviar("VSL_Play", {}, true);
    });
    vsl.addEventListener("timeupdate", function () {
      if (comSom && vsl.duration) registraProgresso((vsl.currentTime / vsl.duration) * 100);
    });
  }
  if (C.dicaRolagem > 0) setTimeout(function () { $("#rolar").classList.add("ver"); }, C.dicaRolagem * 1000);

  /* TRAVA: a página abaixo do vídeo aparece quando a VSL chega em C.liberaEm segundos (com ou sem som).
     Sem trava configurada, com player externo ou se o vídeo não carregar, a página fica livre. */
  var libera = function () {
    if (!doc.classList.contains("trava")) return;
    doc.classList.remove("trava");
    doc.classList.add("liberou");
    try { localStorage.setItem("lp_liberada", "1"); } catch (e) {}
    $("#rolar").classList.add("ver");
  };
  if (!(C.liberaEm > 0) || C.vslEmbed || !vsl) libera();
  else {
    vsl.addEventListener("timeupdate", function () { if (vsl.currentTime >= C.liberaEm) libera(); });
    vsl.addEventListener("error", libera);
    var fonteVsl = vsl.querySelector("source");
    if (fonteVsl) fonteVsl.addEventListener("error", libera);
  }
  // link de remarketing com ?oferta: abre liberado e já na oferta
  if (/[?&]oferta(=|&|$)/.test(location.search)) {
    setTimeout(function () { var o = $("#oferta"); if (o) o.scrollIntoView({ behavior: "auto", block: "start" }); }, 250);
  }

  /* =====================================================================
     ANIMAÇÕES
     ===================================================================== */
  // títulos cinéticos: cada palavra sobe
  $$("[data-cinetico]").forEach(function (h) {
    var i = 0;
    var embrulha = function (no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var o = document.createElement("span"); o.className = "pal";
            var d = document.createElement("span"); d.style.setProperty("--i", i++); d.textContent = p;
            o.appendChild(d); frag.appendChild(o);
          });
          no.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") embrulha(n);
      });
    };
    embrulha(h);
  });

  var aoAparecer = function (sel, fn, limiar) {
    var els = $$(sel);
    if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) { fn(it.target); io.unobserve(it.target); } });
    }, { threshold: limiar || 0.15 });
    els.forEach(function (el) { io.observe(el); });
  };
  aoAparecer(".sobe, [data-cinetico], #dores, .falas, #preco", function (el) { el.classList.add("dentro"); });

  // terminal da abertura digitando
  var termTexto = $("#term-texto"), linhasT = $$("#term .t-linha");
  if (termTexto && !reduz) {
    var frase = termTexto.textContent;
    termTexto.textContent = ""; linhasT.forEach(function (l) { l.style.opacity = "0"; });
    aoAparecer("#term", function () {
      var k = 0;
      var tick = setInterval(function () {
        termTexto.textContent = frase.slice(0, ++k);
        if (k >= frase.length) {
          clearInterval(tick);
          linhasT.forEach(function (l, j) { setTimeout(function () { l.style.transition = "opacity .4s"; l.style.opacity = "1"; }, 400 + j * 480); });
        }
      }, 42);
    }, 0.4);
  }

  // números contando
  aoAparecer("#numeros", function () {
    $$("#numeros [data-conta]").forEach(function (el) {
      var alvo = el.dataset.conta, ehTempo = alvo.indexOf(":") > 0;
      var fim = ehTempo ? Number(alvo.split(":")[0]) * 60 + Number(alvo.split(":")[1]) : Number(alvo);
      var t0 = performance.now(), dur = reduz ? 1 : 1400;
      var passo = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = Math.round(fim * e);
        el.textContent = ehTempo ? String(Math.floor(v / 60)).padStart(2, "0") + ":" + String(v % 60).padStart(2, "0") : String(v);
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }, 0.4);

  // vídeos carregam só quando chegam perto da tela
  var carrega = function (v) { if (v && v.dataset.src && !v.getAttribute("src")) { v.src = v.dataset.src; } };

  // barra de progresso (linha do tempo) + barra fixa de compra + ViewContent
  var progresso = $("#progresso"), enche = $("#enche"), tempo = $("#tempo"), fixa = $("#fixa"), oferta = $("#oferta"), galeria = $("#galeria"), rodape = $("footer");
  var viuOferta = false, TOTAL = 150; // a página "dura" 02:30 na linha do tempo
  var aoRolar = function () {
    var max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
    var p = max > 0 ? Math.min(1, y / max) : 0;
    enche.style.width = (p * 100).toFixed(2) + "%";
    var s = Math.round(p * TOTAL);
    tempo.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    var passou = y > innerHeight * 0.85;
    progresso.classList.toggle("ver", passou);
    var r = oferta.getBoundingClientRect();
    var naOferta = r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15;
    // a barra de compra só aparece depois da galeria (não cobre o "como funciona") e some na oferta e no rodapé
    var depoisGaleria = galeria.getBoundingClientRect().bottom < innerHeight * 0.6;
    var noRodape = rodape.getBoundingClientRect().top < innerHeight;
    var mostra = depoisGaleria && !naOferta && !noRodape;
    fixa.classList.toggle("ver", mostra);
    fixa.setAttribute("aria-hidden", mostra ? "false" : "true");
    $("a", fixa).tabIndex = mostra ? 0 : -1;
    if (!viuOferta && r.top < innerHeight * 0.6) { viuOferta = true; enviar("ViewContent", { content_name: "Oferta Skill Edição Dinâmica", value: Number(C.preco || 97), currency: "BRL" }); }
  };
  var pendente = false;
  addEventListener("scroll", function () { if (!pendente) { pendente = true; requestAnimationFrame(function () { pendente = false; aoRolar(); }); } }, { passive: true });
  addEventListener("resize", aoRolar);
  aoRolar();

  // "como funciona": o celular troca de cena conforme o passo em foco
  var cenas = $$(".fone .cena"), etapas = $$(".etapa");
  var mostraCena = function (n) {
    cenas.forEach(function (c) { c.classList.toggle("ativa", Number(c.dataset.cena) === n); });
    etapas.forEach(function (e) { e.classList.toggle("ativa", Number(e.dataset.etapa) === n); });
    var v = $(".cena-pronto video");
    if (n === 3) { carrega(v); v.play().catch(function () {}); } else if (v) v.pause();
  };
  if ("IntersectionObserver" in window) {
    var ioE = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) mostraCena(Number(it.target.dataset.etapa)); });
    }, { rootMargin: "-62% 0px -30% 0px" });
    etapas.forEach(function (e) { ioE.observe(e); });
  }

  // galeria: toca só o vídeo em foco, pontos e setas
  var trilho = $("#trilho"), pecas = $$(".peca", trilho), pontos = $("#pontos");
  pecas.forEach(function (_, i) { var b = document.createElement("i"); if (!i) b.className = "ativo"; pontos.appendChild(b); });
  var ativa = function (i) {
    pecas.forEach(function (p, k) {
      var v = $("video", p);
      p.classList.toggle("ativa", k === i);
      pontos.children[k].classList.toggle("ativo", k === i);
      if (k === i) { carrega(v); v.play().catch(function () {}); } else v.pause();
    });
  };
  var galeriaVisivel = false, atualG = 0;
  if ("IntersectionObserver" in window) {
    var ioG = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting && galeriaVisivel) { atualG = pecas.indexOf(it.target); ativa(atualG); } });
    }, { root: trilho, threshold: 0.6 });
    pecas.forEach(function (p) { ioG.observe(p); });
    new IntersectionObserver(function (it) {
      galeriaVisivel = it[0].isIntersecting;
      if (galeriaVisivel) ativa(atualG); else pecas.forEach(function (p) { $("video", p).pause(); });
    }, { threshold: 0.25 }).observe(trilho);
  }
  var anda = function (d) { var w = pecas[0].getBoundingClientRect().width + 14; trilho.scrollBy({ left: d * w, behavior: reduz ? "auto" : "smooth" }); };
  $("#ant").addEventListener("click", function () { anda(-1); });
  $("#prox").addEventListener("click", function () { anda(1); });

  // antes / depois: alterna sozinho até a pessoa tocar
  var alt = $("#alternar"), vA = $("#v-antes"), vD = $("#v-depois"), selo = $("#selo-ab"), auto = null;
  var lado = function (qual) {
    var depois = qual === "depois";
    alt.classList.toggle("depois", depois);
    $$("button", alt).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.lado === qual ? "true" : "false"); });
    vA.classList.toggle("oculto", depois); vD.classList.toggle("oculto", !depois);
    selo.textContent = depois ? "O QUE A SKILL ENTREGOU" : "O QUE EU GRAVEI";
    (depois ? vD : vA).currentTime = 0;
  };
  $$("button", alt).forEach(function (b) { b.addEventListener("click", function () { clearInterval(auto); auto = null; lado(b.dataset.lado); }); });
  aoAparecer(".tela-ab", function () {
    carrega(vA); carrega(vD); vA.play().catch(function () {}); vD.play().catch(function () {});
    if (!reduz) auto = setInterval(function () { lado(alt.classList.contains("depois") ? "antes" : "depois"); }, 5500);
  }, 0.3);
})();
