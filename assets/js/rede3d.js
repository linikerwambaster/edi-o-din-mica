/* Rede 3D do topo do site: os "mundos" do Liniker (Meta Ads, WhatsApp, n8n, Claude Code, IA) ligados como um fluxo de automação.
   Partículas correm pelas ligações como leads passando pelo funil. Three.js, pausa quando sai da tela, respeita "reduzir movimento". */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("rede");
const caixaRotulos = document.querySelector(".rotulos");
const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = window.matchMedia("(max-width: 760px)").matches;

function iniciar() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 1.75));
  const cena = new THREE.Scene();
  cena.fog = new THREE.FogExp2(0x08090c, 0.045);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.set(0, 0.6, celular ? 21 : 16);

  const grupo = new THREE.Group();
  cena.add(grupo);

  // textura de brilho redonda (para os pontos e halos)
  const tex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,255,255,.85)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();

  // os 5 mundos (hubs)
  const HUBS = [
    { nome: "Meta Ads", cor: 0x5b8cff, pos: [-5.2, 1.6, 0.5] },
    { nome: "WhatsApp", cor: 0x3ddc97, pos: [4.8, -0.6, 1.2] },
    { nome: "n8n", cor: 0xff6d5a, pos: [0.4, -2.4, -1.5] },
    { nome: "Claude Code", cor: 0xd97757, pos: [2.6, 3.0, -2.2] },
    { nome: "IA", cor: 0xc084fc, pos: [-2.4, -1.2, 3.0] },
  ];
  const vec = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const nos = HUBS.map((h) => ({ p: vec(h.pos), hub: h }));

  // nós pequenos espalhados numa casca
  const QTD = celular ? 46 : 78;
  for (let i = 0; i < QTD; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = 3.5 + Math.random() * 4.8;
    const s = Math.sqrt(1 - u * u);
    nos.push({ p: new THREE.Vector3(r * s * Math.cos(t) * 1.35, r * u * 0.75, r * s * Math.sin(t)) });
  }

  // ligações: cada nó com os 2 mais próximos + os hubs entre si em ciclo
  const ligs = [];
  const chave = new Set();
  const liga = (a, b) => { const k = a < b ? a + "-" + b : b + "-" + a; if (a !== b && !chave.has(k)) { chave.add(k); ligs.push([a, b]); } };
  nos.forEach((n, i) => {
    const prox = nos.map((m, j) => [j, n.p.distanceToSquared(m.p)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 2);
    prox.forEach(([j]) => liga(i, j));
  });
  for (let i = 0; i < HUBS.length; i++) liga(i, (i + 1) % HUBS.length);
  liga(0, 2); liga(1, 3);

  const posLinhas = new Float32Array(ligs.length * 6);
  ligs.forEach(([a, b], k) => { nos[a].p.toArray(posLinhas, k * 6); nos[b].p.toArray(posLinhas, k * 6 + 3); });
  const gLinhas = new THREE.BufferGeometry(); gLinhas.setAttribute("position", new THREE.BufferAttribute(posLinhas, 3));
  grupo.add(new THREE.LineSegments(gLinhas, new THREE.LineBasicMaterial({ color: 0x4a6fd8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })));

  // pontos pequenos
  const posPts = new Float32Array((nos.length - HUBS.length) * 3);
  nos.slice(HUBS.length).forEach((n, k) => n.p.toArray(posPts, k * 3));
  const gPts = new THREE.BufferGeometry(); gPts.setAttribute("position", new THREE.BufferAttribute(posPts, 3));
  grupo.add(new THREE.Points(gPts, new THREE.PointsMaterial({ size: 0.22, map: tex, color: 0xa9c8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  // hubs: esfera + halo
  const halos = [];
  HUBS.forEach((h, i) => {
    const esf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), new THREE.MeshBasicMaterial({ color: h.cor }));
    esf.position.copy(nos[i].p); grupo.add(esf);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: h.cor, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(2.6); halo.position.copy(nos[i].p); grupo.add(halo); halos.push(halo);
  });

  // pulsos correndo pelas ligações (leads no funil)
  const PULSOS = celular ? 70 : 140;
  const pulsos = Array.from({ length: PULSOS }, () => ({ l: Math.floor(Math.random() * ligs.length), t: Math.random(), v: 0.15 + Math.random() * 0.35 }));
  const posPul = new Float32Array(PULSOS * 3);
  const gPul = new THREE.BufferGeometry(); gPul.setAttribute("position", new THREE.BufferAttribute(posPul, 3));
  grupo.add(new THREE.Points(gPul, new THREE.PointsMaterial({ size: 0.16, map: tex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  // rótulos HTML que acompanham os hubs
  const rotulos = HUBS.map((h) => { const el = document.createElement("div"); el.className = "rotulo"; el.textContent = h.nome; caixaRotulos && caixaRotulos.appendChild(el); return el; });

  let larg = 0, alt = 0;
  const ajusta = () => {
    const r = canvas.parentElement.getBoundingClientRect(); larg = r.width; alt = r.height;
    renderer.setSize(larg, alt, false); cam.aspect = larg / alt; cam.updateProjectionMatrix();
  };
  ajusta(); window.addEventListener("resize", ajusta);

  let mx = 0, my = 0, rolagem = 0;
  window.addEventListener("pointermove", (e) => { mx = (e.clientX / window.innerWidth - 0.5); my = (e.clientY / window.innerHeight - 0.5); }, { passive: true });
  window.addEventListener("scroll", () => { rolagem = Math.min(1, window.scrollY / (alt || 800)); }, { passive: true });

  let visivel = true;
  new IntersectionObserver((it) => { visivel = it[0].isIntersecting; }).observe(canvas);

  const tmp = new THREE.Vector3();
  const relogio = new THREE.Clock();
  const quadro = () => {
    requestAnimationFrame(quadro);
    if (!visivel) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const tempo = relogio.elapsedTime;
    grupo.rotation.y += reduz ? 0 : dt * 0.06;
    grupo.rotation.x += ((my * 0.25 + rolagem * 0.35) - grupo.rotation.x) * 0.04;
    cam.position.x += (mx * 1.6 - cam.position.x) * 0.04;
    cam.position.z = (celular ? 21 : 16) - rolagem * 3;
    cam.lookAt(0, 0, 0);
    if (!reduz) {
      pulsos.forEach((p, i) => {
        p.t += dt * p.v;
        if (p.t >= 1) { p.t = 0; const [, b] = ligs[p.l]; const saindo = ligs.map((l, k) => [l, k]).filter(([l]) => l[0] === b || l[1] === b); p.l = saindo.length ? saindo[Math.floor(Math.random() * saindo.length)][1] : Math.floor(Math.random() * ligs.length); }
        const [a, b] = ligs[p.l]; tmp.lerpVectors(nos[a].p, nos[b].p, p.t); tmp.toArray(posPul, i * 3);
      });
      gPul.attributes.position.needsUpdate = true;
      halos.forEach((h, i) => h.scale.setScalar(2.4 + Math.sin(tempo * 1.6 + i) * 0.3));
    }
    renderer.render(cena, cam);
    // rótulos
    HUBS.forEach((h, i) => {
      tmp.copy(nos[i].p).applyMatrix4(grupo.matrixWorld).project(cam);
      const el = rotulos[i];
      el.style.left = ((tmp.x + 1) / 2 * larg) + "px"; el.style.top = ((1 - tmp.y) / 2 * alt) + "px";
      el.style.opacity = tmp.z < 1 ? String(0.35 + 0.65 * (1 - Math.min(1, Math.max(0, (tmp.z - 0.9) * 8)))) : "0";
    });
  };
  quadro();
}

if (canvas) iniciar();
