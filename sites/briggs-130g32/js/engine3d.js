/* 3D teardown viewer for the generic engine model: toggles, isolate, tap-to-select, step teardown, explode, see-through. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const { $, $$, esc, toast } = window.U;
const E = window.ENGINE3D;
const COLORS = ["#c9a227", "#5b9bd5", "#3a3f47", "#d0583a", "#7f8fa6", "#2e3440", "#e8e2d0", "#9aa7b8", "#e0b000", "#6aa36f", "#b07d4f", "#a7b3c2"];

const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(2, 3, 2.5); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(-2, 1, -2); scene.add(fill);
const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const parts = new Map();   // id -> { obj, info, home, dir, mats }
let model, center = new THREE.Vector3(), size = 1, explode = 0, xray = false, selected = null, step = 0;
const removed = new Set();  // step indexes taken off in teardown

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function frame(target) {
  const box = new THREE.Box3();
  (target ? [target] : [...parts.values()].filter((p) => p.obj.visible).map((p) => p.obj)).forEach((o) => box.expandByObject(o));
  if (box.isEmpty()) box.setFromObject(model);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()).length();
  controls.target.copy(c);
  camera.position.copy(c).add(new THREE.Vector3(0.9, 0.55, 1.1).normalize().multiplyScalar(s * 1.45));
  camera.near = s / 200; camera.far = s * 40; camera.updateProjectionMatrix();
}

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
if (!window.MODEL_3D) {
  $("#loading").innerHTML = `<div style="max-width:440px;padding:16px;text-align:center;display:grid;gap:8px"><b>The 3D model is only in the offline copy of this site.</b><span>It came from a CAD file that is not posted online. Open the local copy to rotate it and take it apart. The <a href="assembly.html">Build It / Take It Apart</a> page works here.</span></div>`;
  ["#tear-next", "#tear-back", "#tear-reset", "#show-all", "#xray", "#reset-view", "#explode", "#find"].forEach((s) => { const el = $(s); if (el) el.disabled = true; });
} else loader.load("models/engine-generic.glb", (gltf) => {
  model = gltf.scene; scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  box.getCenter(center); size = box.getSize(new THREE.Vector3()).length();
  const byId = new Map(E.parts.map((p) => [p.id, p]));
  model.traverse((o) => {
    const info = byId.get(o.name); if (!info || parts.has(o.name)) return;
    const pb = new THREE.Box3().setFromObject(o), pc = pb.getCenter(new THREE.Vector3());
    const dir = pc.clone().sub(center); if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
    const col = new THREE.Color(COLORS[info.step % COLORS.length]);
    const mats = [];
    o.traverse((m) => { if (m.isMesh) { m.material = new THREE.MeshStandardMaterial({ color: col, metalness: 0.15, roughness: 0.6, flatShading: !m.geometry.attributes.normal, side: THREE.DoubleSide }); m.userData.pid = o.name; mats.push(m.material); } });
    // explode direction, converted from world space into the part's parent space
    const dw = dir.clone().normalize().multiplyScalar(Math.min(1, dir.length() / size * 2.5) + 0.25);
    o.parent.updateWorldMatrix(true, false);
    const a = o.parent.worldToLocal(pc.clone()), b = o.parent.worldToLocal(pc.clone().add(dw));
    parts.set(o.name, { obj: o, info, home: o.position.clone(), dir: b.sub(a), mats, color: col });
  });
  $("#loading").remove();
  resize(); frame(); buildList(); updateTear(); applyExplode();
}, (ev) => { if (ev.total) $("#loading").textContent = `Loading the 3D model... ${Math.round(ev.loaded / ev.total * 100)}%`; },
() => { $("#loading").textContent = "The 3D model could not load. Open this site through the local server (python3 -m http.server)."; });

(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
window.ENGINE3D_VIEW = { camera, parts };   // read by the automated tests

// ---------- explode + see-through ----------
function applyExplode() {
  parts.forEach((p) => p.obj.position.copy(p.home).addScaledVector(p.dir, explode * size * 0.25));
}
$("#explode").addEventListener("input", (e) => { explode = e.target.value / 100; applyExplode(); });
$("#explode").addEventListener("change", () => frame());
$("#xray").addEventListener("click", (e) => {
  xray = !xray; e.currentTarget.setAttribute("aria-pressed", xray);
  parts.forEach((p) => p.mats.forEach((m) => { m.transparent = xray; m.opacity = xray ? 0.28 : 1; m.depthWrite = !xray; m.needsUpdate = true; }));
  if (selected) highlight(selected);
});

// ---------- visibility ----------
function setVis(id, v) { const p = parts.get(id); if (p) p.obj.visible = v; const cb = document.getElementById("cb-" + id); if (cb) cb.checked = v; }
function syncGroups() {
  E.steps.forEach((_, si) => {
    const ids = E.parts.filter((p) => p.step === si).map((p) => p.id);
    const on = ids.filter((id) => parts.get(id) && parts.get(id).obj.visible).length;
    const g = document.getElementById("g-" + si); if (!g) return;
    g.checked = on === ids.length; g.indeterminate = on > 0 && on < ids.length;
    document.getElementById("gc-" + si).textContent = `${on}/${ids.length}`;
  });
}
function showAll() { parts.forEach((_, id) => setVis(id, true)); removed.clear(); step = 0; updateTear(); syncGroups(); }
$("#show-all").onclick = () => { showAll(); frame(); };
$("#reset-view").onclick = () => { $("#explode").value = 0; explode = 0; applyExplode(); frame(); };

// ---------- parts list ----------
function buildList() {
  $("#groups").innerHTML = E.steps.map((s, si) => {
    const list = E.parts.filter((p) => p.step === si);
    const main = list.filter((p) => !p.small), small = list.filter((p) => p.small);
    return `<details class="grp" data-step="${si}"><summary><input type="checkbox" id="g-${si}" data-group="${si}" checked aria-label="Show ${esc(s.title)}"><span class="sw" style="background:${COLORS[si % COLORS.length]}"></span><span>${si + 1}. ${esc(s.title)}</span><span class="cnt" id="gc-${si}"></span></summary>
      <div class="plist">${main.map((p) => row(p)).join("")}${small.length ? `<details><summary class="small" style="cursor:pointer;min-height:40px;display:flex;align-items:center">+ ${small.length} small screws, nuts and washers</summary>${small.map((p) => row(p)).join("")}</details>` : ""}</div></details>`;
  }).join("");
  syncGroups();
}
const row = (p) => `<label id="row-${p.id}" data-name="${esc((p.name + " " + p.cad).toLowerCase())}"><input type="checkbox" id="cb-${p.id}" data-part="${p.id}" checked> <span>${esc(p.name)}</span><button type="button" class="btn ghost" data-pick="${p.id}" style="margin-left:auto;min-height:36px;padding:2px 10px;font-size:.85rem">Select</button></label>`;
$("#groups").addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.group) { const si = +t.dataset.group; E.parts.filter((p) => p.step === si).forEach((p) => setVis(p.id, t.checked)); }
  if (t.dataset.part) setVis(t.dataset.part, t.checked);
  syncGroups();
});
$("#groups").addEventListener("click", (e) => {
  if (e.target.closest("summary input")) e.stopPropagation();
  const b = e.target.closest("[data-pick]"); if (b) { e.preventDefault(); select(b.dataset.pick, true); }
});
$("#find").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  $$("#groups .grp").forEach((g) => {
    let any = false;
    g.querySelectorAll("label[data-name]").forEach((l) => { const hit = !q || l.dataset.name.includes(q); l.hidden = !hit; any = any || hit; });
    g.hidden = !any; g.open = !!q && any;
    g.querySelectorAll("details").forEach((d) => (d.open = !!q));
  });
});

// ---------- select ----------
const HL = new THREE.Color("#ff5a1f");
function highlight(id) {
  parts.forEach((p, pid) => p.mats.forEach((m) => { m.emissive = pid === id ? HL : new THREE.Color(0); m.emissiveIntensity = pid === id ? 0.7 : 0; if (pid === id && xray) { m.opacity = 1; m.transparent = false; m.depthWrite = true; } m.needsUpdate = true; }));
}
function select(id, fromList) {
  selected = id; highlight(id);
  $$("#groups label.sel").forEach((l) => l.classList.remove("sel"));
  const r = document.getElementById("row-" + id); if (r) { r.classList.add("sel"); if (!fromList) { const g = r.closest(".grp"); g.open = true; const d = r.closest("details:not(.grp)"); if (d) d.open = true; r.scrollIntoView({ block: "nearest" }); } }
  const p = parts.get(id), info = p.info, s = E.steps[info.step];
  const card = info.card ? window.DATA.PARTS.find((x) => x.id === info.card) : null;
  $("#sel").className = "callout warn";
  $("#sel").innerHTML = `<b class="tag">${esc(info.name)}</b><span>Teardown step ${info.step + 1}: ${esc(s.title)}${s.tool ? " &middot; Tool: " + esc(s.tool) : ""}</span>
    ${card ? `<span><b>On your 130G32:</b> ${esc(card.does)} <a href="parts.html#p-${card.id}">Open the ${esc(card.name)} card</a></span>` : ""}
    <span class="small">CAD name: ${esc(info.cad)} (from the generic model, not a Briggs part number)</span>
    <div class="row"><button class="btn ghost" type="button" data-act="hide">Hide it</button><button class="btn ghost" type="button" data-act="only">Show only this</button><button class="btn ghost" type="button" data-act="zoom">Zoom to it</button><button class="btn ghost" type="button" data-act="all">Show all</button></div>`;
}
$("#sel").addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]"); if (!a || !selected) return;
  const act = a.dataset.act;
  if (act === "hide") setVis(selected, false);
  if (act === "only") { parts.forEach((_, id) => setVis(id, id === selected)); frame(parts.get(selected).obj); }
  if (act === "zoom") frame(parts.get(selected).obj);
  if (act === "all") { showAll(); frame(); }
  syncGroups();
});
// tap to select (ignore drags)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const vis = []; parts.forEach((p) => p.obj.visible && p.obj.traverse((m) => m.isMesh && vis.push(m)));
  const hit = ray.intersectObjects(vis, false)[0];
  if (hit) select(hit.object.userData.pid);
});

// ---------- step-by-step teardown ----------
function updateTear() {
  const n = E.steps.length - 1;   // the block stays
  if (step >= n) { $("#tear-now").textContent = "Torn down to the block!"; $("#tear-tool").textContent = "Press Put the last one back to rebuild, step by step."; $("#tear-next").disabled = true; }
  else { $("#tear-now").textContent = `Step ${step + 1} of ${n}: ${E.steps[step].title}`; $("#tear-tool").textContent = "Tool: " + E.steps[step].tool; $("#tear-next").disabled = false; }
  $("#tear-back").disabled = step === 0;
  $("#tear-bar").style.width = (step / n) * 100 + "%";
}
function animateGroup(si, out, done) {
  const list = [...parts.values()].filter((p) => p.info.step === si);
  if (!out) list.forEach((p) => { p.obj.visible = true; });
  const t0 = performance.now(), D = 450;
  (function tick(now) {
    const k = Math.min(1, (now - t0) / D), e = out ? k * k : 1 - (1 - k) * (1 - k);
    list.forEach((p) => p.obj.position.copy(p.home).addScaledVector(p.dir, explode * size * 0.25).addScaledVector(p.dir, (out ? e : 1 - e) * size * 0.6));
    if (k < 1) requestAnimationFrame(tick);
    else { list.forEach((p) => { if (out) p.obj.visible = false; }); applyExplode(); list.forEach((p) => setVis(p.obj.name, !out)); syncGroups(); done && done(); }
  })(t0);
}
$("#tear-next").onclick = () => {
  if (step >= E.steps.length - 1) return;
  const si = step; removed.add(si); step++; updateTear();
  animateGroup(si, true);
  if (step === E.steps.length - 1) toast("Torn down to the block");
};
$("#tear-back").onclick = () => { if (!step) return; step--; removed.delete(step); updateTear(); animateGroup(step, false); };
$("#tear-reset").onclick = () => { showAll(); applyExplode(); frame(); };
