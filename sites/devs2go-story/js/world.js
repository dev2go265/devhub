/* ==========================================================================
   The Devs2Go Story: the living 3D world
   One persistent Three.js scene behind the whole page. It reads window.D2G
   (set by main.js and chapters.js) every frame:
     travel  linear scroll position → camera flies forward
     story   eased chapter position → mood crossfade + chapter layers
     pivot   Chapter 2 dial → morphs the Discord world into the studio
     flop    Chapter 1 chat reached the end → bubbles sink and fade
     pulse   stack / goal / pivot interactions → code-rain burst
     future  Chapter 4 goals lit → sunrise particles brighten
   Layers: particle field · code glyphs · wireframes · mouse-lit solids · fog
   volumes · chat bubbles (1) · studio lines (2) · code rain (3) · sunrise (4).
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

const D = (window.D2G = window.D2G || {});
D.mouse = D.mouse || { x: 0, y: 0 };

const canvas = document.getElementById('world');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 767px), (pointer: coarse)').matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (v) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
const weight = (s, k) => smooth(1 - Math.abs(s - k));
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- Chapter moods (0 hero · 1 Discord · 2 studio · 3 terminal · 4 sunrise · 5 footer) ---------- */
const MOODS = [
  { bg: '#04050b', fog: '#0a1026', a: '#2f6bff', b: '#8fb0ff', p: '#9fb6ff', glow: '#16307a', density: 0.022 },
  { bg: '#06071a', fog: '#171a4d', a: '#5865f2', b: '#eb459e', p: '#b4baff', glow: '#3a3fc0', density: 0.026 },
  { bg: '#0b0e15', fog: '#2c3342', a: '#f4f6fb', b: '#a9b8d6', p: '#ffffff', glow: '#6d7890', density: 0.02 },
  { bg: '#010603', fog: '#03200e', a: '#3dff8a', b: '#12b35f', p: '#6dffa8', glow: '#0b6a34', density: 0.03 },
  { bg: '#110509', fog: '#45161a', a: '#ff8a3d', b: '#ffd166', p: '#ffb36b', glow: '#b8452a', density: 0.022 },
  { bg: '#170807', fog: '#5e2418', a: '#ffae57', b: '#ffe29a', p: '#ffd08a', glow: '#e0673a', density: 0.019 }
].map((m) => ({
  bg: new THREE.Color(m.bg), fog: new THREE.Color(m.fog), a: new THREE.Color(m.a),
  b: new THREE.Color(m.b), p: new THREE.Color(m.p), glow: new THREE.Color(m.glow), density: m.density
}));
const cur = { bg: new THREE.Color(), fog: new THREE.Color(), a: new THREE.Color(), b: new THREE.Color(), p: new THREE.Color(), glow: new THREE.Color(), density: 0.02 };

function mix(s) {
  const i = clamp(Math.floor(s), 0, MOODS.length - 2);
  const f = clamp(s - i, 0, 1);
  const A = MOODS[i], B = MOODS[i + 1];
  for (const k of ['bg', 'fog', 'a', 'b', 'p', 'glow']) cur[k].lerpColors(A[k], B[k], f);
  cur.density = A.density + (B.density - A.density) * f;
}

/* ---------- Camera path ---------- */
const CAM_START = 30;
const CAM_STEP = 13;                      // world units travelled per chapter
const chapterZ = (k) => CAM_START - k * CAM_STEP - 18; // where chapter k's scenery sits

/* ---------- Small texture helpers ---------- */
function radialTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function glyphTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.font = '500 64px "JetBrains Mono", ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,255,255,.9)';
  g.shadowBlur = 14;
  g.fillStyle = '#ffffff';
  g.fillText(text, 128, 66);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 2;
  return t;
}

const RAIN_CHARS = '01{}[]()<>=+-*/;:.#$&|!?%~ABCDEFabcdefxyz23456789constletfnreturnasyncawait'.slice(0, 64);
function rainAtlas() {
  const cells = 8, cell = 64;
  const c = document.createElement('canvas');
  c.width = c.height = cells * cell;
  const g = c.getContext('2d');
  g.font = '500 44px "JetBrains Mono", ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  for (let i = 0; i < 64; i++) {
    g.fillText(RAIN_CHARS[i] || '0', (i % cells) * cell + cell / 2, Math.floor(i / cells) * cell + cell / 2 + 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  return t;
}

/* ---------- Shaders ---------- */
const FIELD_VERT = /* glsl */`
  attribute float aScale;
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  uniform vec3 uMouse;
  varying float vSeed;
  varying float vGlow;
  varying float vDepth;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.13 + aSeed * 21.0) * 0.8;
    p.y += cos(uTime * 0.11 + aSeed * 13.0) * 0.8;
    vec2 d = p.xy - uMouse.xy;
    float infl = smoothstep(8.0, 0.0, length(d)) * smoothstep(16.0, 0.0, abs(p.z - uMouse.z));
    p.xy += normalize(d + 0.0001) * infl * 2.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPR * (1.0 + infl * 2.0) * (18.0 / -mv.z);
    vSeed = aSeed;
    vGlow = infl;
    vDepth = -mv.z;
  }
`;
const FIELD_FRAG = /* glsl */`
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  uniform float uFog;
  varying float vSeed;
  varying float vGlow;
  varying float vDepth;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, r), 1.7);
    vec3 col = mix(uColorA, uColorB, vSeed) + vGlow * 0.7;
    float fog = exp(-pow(uFog * vDepth, 2.0));
    gl_FragColor = vec4(col, a * uOpacity * (0.5 + vGlow) * fog);
  }
`;

const RAIN_VERT = /* glsl */`
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aTrail;
  attribute float aGlyph;
  attribute float aFlick;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  uniform float uBoost;
  uniform float uTrailLen;
  varying float vBright;
  varying float vGlyph;
  varying float vDepth;
  void main() {
    float span = 44.0;
    float head = 22.0 - mod(uTime * aSpeed * (1.0 + uBoost * 2.5) + aOffset * span, span + uTrailLen * 1.1);
    vec3 p = position;
    p.y = head + aTrail * 1.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * uPR * (22.0 / -mv.z), 30.0 * uPR);
    vBright = 1.0 - aTrail / uTrailLen;
    vGlyph = floor(mod(aGlyph + floor(uTime * aFlick), 64.0));
    vDepth = -mv.z;
  }
`;
const RAIN_FRAG = /* glsl */`
  uniform sampler2D uAtlas;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFog;
  uniform float uBoost;
  varying float vBright;
  varying float vGlyph;
  varying float vDepth;
  void main() {
    vec2 cell = vec2(mod(vGlyph, 8.0), floor(vGlyph / 8.0));
    vec2 uv = (cell + gl_PointCoord) / 8.0;
    float a = texture2D(uAtlas, uv).a;
    float headGlow = step(0.99, vBright);
    vec3 col = mix(uColor * (0.35 + vBright * 0.9), vec3(0.85, 1.0, 0.9), headGlow * 0.8) * (1.0 + uBoost);
    float fog = exp(-pow(uFog * vDepth, 2.0));
    float near = smoothstep(7.0, 16.0, vDepth);
    gl_FragColor = vec4(col, a * uOpacity * 0.8 * pow(vBright, 1.3) * fog * near);
  }
`;

const RISE_VERT = /* glsl */`
  attribute float aScale;
  attribute float aSeed;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  uniform float uBoost;
  varying float vSeed;
  varying float vDepth;
  varying float vTw;
  void main() {
    vec3 p = position;
    float span = 46.0;
    p.y = mod(p.y + 23.0 + uTime * aSpeed * (1.0 + uBoost * 1.6), span) - 23.0;
    p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vTw = 0.6 + 0.4 * sin(uTime * 2.2 + aSeed * 50.0);
    gl_PointSize = uSize * aScale * uPR * vTw * (18.0 / -mv.z);
    vSeed = aSeed;
    vDepth = -mv.z;
  }
`;
const RISE_FRAG = /* glsl */`
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  uniform float uFog;
  uniform float uBoost;
  varying float vSeed;
  varying float vDepth;
  varying float vTw;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, r), 1.5);
    vec3 col = mix(uColorA, uColorB, vSeed) * (1.0 + uBoost * 0.8);
    float fog = exp(-pow(uFog * vDepth, 2.0));
    gl_FragColor = vec4(col, a * uOpacity * vTw * fog);
  }
`;

/* ========================================================================== */
async function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    return; // No WebGL: the CSS gradient fallback stays visible
  }

  // Wait briefly for the mono font so glyph textures use it
  if (document.fonts && document.fonts.load) {
    await Promise.race([
      document.fonts.load('500 64px "JetBrains Mono"'),
      new Promise((r) => setTimeout(r, 1500))
    ]).catch(() => {});
  }

  const MAX_DPR = mobile ? 1.3 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const camera = new THREE.PerspectiveCamera(mobile ? 68 : 55, 1, 0.1, 240);
  camera.position.set(0, 0, CAM_START);

  let W = 0, H = 0;
  function resize() {
    const w = innerWidth, h = innerHeight;
    // Ignore small height changes (mobile URL bar) to avoid resize jank
    if (w === W && Math.abs(h - H) < 140) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 70 : (mobile ? 64 : 55);
    camera.updateProjectionMatrix();
    for (const m of pointMats) m.uniforms.uPR.value = dpr;
  }

  const soft = radialTexture();
  const pointMats = [];
  const count = (desktop, phone) => (mobile ? phone : desktop);

  /* ---------- Particle field (everywhere, all the time) ---------- */
  const field = (() => {
    const n = count(2600, 900);
    const pos = new Float32Array(n * 3), scale = new Float32Array(n), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rand(-48, 48);
      pos[i * 3 + 1] = rand(-30, 30);
      pos[i * 3 + 2] = rand(-150, 36);
      scale[i] = Math.pow(Math.random(), 2.2) * 2.6 + 0.4;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: FIELD_VERT, fragmentShader: FIELD_FRAG,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: 5.5 }, uPR: { value: dpr }, uMouse: { value: new THREE.Vector3() },
        uColorA: { value: new THREE.Color() }, uColorB: { value: new THREE.Color() }, uOpacity: { value: 1 }, uFog: { value: 0.02 }
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    pointMats.push(mat);
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return mat;
  })();

  /* ---------- Floating code glyphs ---------- */
  const GLYPHS = ['{ }', '</>', '=>', '( )', '[ ]', 'const', 'let', '&&', '#', '::', 'npm', '.tsx', '<div>', 'import', ';', '//', '===', 'async', '?.', 'git', '++', '!=', '{...}', 'fn()'];
  const glyphs = [];
  {
    const n = count(38, 16);
    const texCache = new Map();
    for (let i = 0; i < n; i++) {
      const text = GLYPHS[i % GLYPHS.length];
      if (!texCache.has(text)) texCache.set(text, glyphTexture(text));
      const mat = new THREE.SpriteMaterial({ map: texCache.get(text), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, opacity: 0.55 });
      const s = new THREE.Sprite(mat);
      const size = rand(1.6, 3.4);
      s.scale.set(size * 2, size, 1);
      s.position.set(rand(-30, 30), rand(-17, 17), rand(-140, 22));
      s.userData = { vy: rand(0.12, 0.4), sway: rand(0.2, 0.8), phase: rand(0, 6.28), spin: rand(-0.08, 0.08), base: rand(0.35, 0.75), tint: Math.random() };
      scene.add(s);
      glyphs.push(s);
    }
  }

  /* ---------- Wireframe geometry along the path ---------- */
  const wires = [];
  {
    const defs = [
      [new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(4.2, 1)), [-15, 6, 6]],
      [new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(3, 0.75, 70, 8)), [16, -5, -12]],
      [new THREE.EdgesGeometry(new THREE.OctahedronGeometry(3.6, 0)), [-13, -7, -28]],
      [new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(4, 0)), [14, 7, -44]],
      [new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 6, 6)), [-16, 5, -60]],
      [new THREE.WireframeGeometry(new THREE.TorusGeometry(5, 1.4, 8, 24)), [15, -6, -76]],
      [new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(9, 1)), [0, 2, -118]]
    ];
    defs.forEach(([geo, p], i) => {
      const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
      const line = new THREE.LineSegments(geo, mat);
      line.position.set(p[0], p[1], p[2]);
      line.userData = { rx: rand(0.05, 0.16) * (i % 2 ? 1 : -1), ry: rand(0.06, 0.18), phase: rand(0, 6.28), baseY: p[1] };
      scene.add(line);
      wires.push(line);
    });
  }

  /* ---------- Mouse-lit solids + neon lights ---------- */
  const solids = [];
  let solidMat = null;
  {
    const shapes = [
      [new THREE.OctahedronGeometry(1.5, 0), [14, -6, 12]],
      [new THREE.IcosahedronGeometry(1.4, 0), [-15, 7, 0]],
      [new THREE.BoxGeometry(2, 2, 2), [15, 8, -16]],
      [new THREE.DodecahedronGeometry(1.5, 0), [-14, -8, -32]],
      [new THREE.TetrahedronGeometry(1.8, 0), [13, 8, -48]],
      [new THREE.OctahedronGeometry(1.8, 0), [-13, -7, -64]]
    ];
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1d2a, metalness: 0.8, roughness: 0.25, flatShading: true, emissive: 0x000000 });
    solidMat = mat;
    shapes.forEach(([geo, p]) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(p[0], p[1], p[2]);
      m.userData = { r: new THREE.Vector3(rand(0.1, 0.4), rand(0.1, 0.4), 0), phase: rand(0, 6.28), baseY: p[1] };
      scene.add(m);
      solids.push(m);
    });
  }
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const mouseLight = new THREE.PointLight(0xffffff, 380, 0, 2);
  const rimLight = new THREE.PointLight(0xffffff, 260, 0, 2);
  scene.add(mouseLight, rimLight);

  /* ---------- Volumetric-feeling fog volumes ---------- */
  const fogs = [];
  {
    const n = count(9, 5);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({ map: soft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.16, fog: false });
      const s = new THREE.Sprite(mat);
      const size = rand(34, 70);
      s.scale.set(size, size * rand(0.5, 0.8), 1);
      s.position.set(rand(-34, 34), rand(-14, 12), 10 - i * (150 / n));
      s.userData = { phase: rand(0, 6.28), base: rand(0.1, 0.2), bx: s.position.x };
      scene.add(s);
      fogs.push(s);
    }
  }

  /* ---------- Chapter 1: chat bubbles drifting by ---------- */
  const bubbles = new THREE.Group();
  const bubbleMats = [];
  {
    const shape = new THREE.Shape();
    const w = 3.4, h = 1.7, r = 0.6;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(-w / 2 + 1.1, -h / 2);
    shape.lineTo(-w / 2 + 0.55, -h / 2 - 0.55); // tail
    shape.lineTo(-w / 2 + 0.75, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const fillGeo = new THREE.ShapeGeometry(shape, 8);
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(shape.getPoints(10));
    const barGeo = new THREE.PlaneGeometry(1, 0.16);

    const n = count(22, 11);
    const z0 = chapterZ(1);
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const fillMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, fog: true });
      const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false, fog: true });
      const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: true });
      g.add(new THREE.Mesh(fillGeo, fillMat));
      g.add(new THREE.LineLoop(edgeGeo, edgeMat));
      const lines = 1 + (i % 3);
      for (let l = 0; l < lines; l++) {
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.scale.x = l === lines - 1 ? rand(0.9, 1.6) : rand(1.8, 2.5);
        bar.position.set(-1.35 + bar.scale.x / 2, 0.42 - l * 0.4 + (3 - lines) * 0.2, 0.01);
        g.add(bar);
      }
      const mirror = i % 2 ? -1 : 1;
      g.scale.set(mirror * rand(0.7, 1.25), 1, 1).multiplyScalar(1);
      const side = Math.random() < 0.3 ? rand(-24, -15) : rand(3, 21);
      g.position.set(side, rand(-10, 10), z0 + rand(-16, 8));
      g.rotation.set(rand(-0.2, 0.2), rand(-0.35, 0.35), rand(-0.1, 0.1));
      g.userData = { baseY: g.position.y, vy: rand(0.2, 0.55), phase: rand(0, 6.28), fall: 0 };
      bubbles.add(g);
      bubbleMats.push({ fillMat, edgeMat, barMat });
    }
    scene.add(bubbles);
  }

  /* ---------- Chapter 2: clean studio lines ---------- */
  const studio = new THREE.Group();
  const studioMats = [];
  {
    const z0 = chapterZ(2);
    // Floor grid
    const pts = [];
    for (let x = -44; x <= 44; x += 2.2) pts.push(x, -13, z0 + 26, x, -13, z0 - 40);
    for (let z = z0 + 26; z >= z0 - 40; z -= 2.2) pts.push(-44, -13, z, 44, -13, z);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false, fog: true });
    studio.add(new THREE.LineSegments(gridGeo, gridMat));
    studioMats.push([gridMat, 0.22]);

    // Softbox light panels and sharp vertical strips
    const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, side: THREE.DoubleSide });
    studioMats.push([panelMat, 0.4]);
    [[-14, 16, z0 - 8, 9, 1.1], [14, 16, z0 - 12, 9, 1.1], [0, 19, z0 - 26, 14, 1.3]].forEach(([x, y, z, w, h]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panelMat);
      m.position.set(x, y, z);
      m.rotation.x = Math.PI / 2.4;
      studio.add(m);
    });
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    studioMats.push([stripMat, 0.45]);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, rand(14, 30)), stripMat);
      m.position.set((i - 5.5) * 6.2 + rand(-1, 1), rand(-2, 4), z0 - 40 + rand(-4, 4));
      studio.add(m);
    }
    // A scan line that sweeps across
    const scanMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    studioMats.push([scanMat, 0.35]);
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.05), scanMat);
    scan.position.set(0, 0, z0 - 20);
    scan.userData.scan = true;
    studio.add(scan);
    studio.userData.scan = scan;
    scene.add(studio);
  }

  /* ---------- Chapter 3: falling code rain ---------- */
  const rain = (() => {
    const cols = count(120, 46), trail = mobile ? 11 : 15;
    const n = cols * trail;
    const z0 = chapterZ(3);
    const pos = new Float32Array(n * 3), speed = new Float32Array(n), offset = new Float32Array(n),
      tr = new Float32Array(n), glyph = new Float32Array(n), flick = new Float32Array(n);
    let k = 0;
    for (let c = 0; c < cols; c++) {
      const x = rand(-36, 36), z = z0 + rand(-34, -2), sp = rand(3.5, 9), off = Math.random();
      for (let t = 0; t < trail; t++, k++) {
        pos[k * 3] = x; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z;
        speed[k] = sp; offset[k] = off; tr[k] = t;
        glyph[k] = Math.floor(Math.random() * 64); flick[k] = rand(1.5, 7);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1));
    geo.setAttribute('aTrail', new THREE.BufferAttribute(tr, 1));
    geo.setAttribute('aGlyph', new THREE.BufferAttribute(glyph, 1));
    geo.setAttribute('aFlick', new THREE.BufferAttribute(flick, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: 30 }, uPR: { value: dpr }, uBoost: { value: 0 }, uTrailLen: { value: trail },
        uAtlas: { value: rainAtlas() }, uColor: { value: new THREE.Color() }, uOpacity: { value: 0 }, uFog: { value: 0.03 }
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    pointMats.push(mat);
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    scene.add(pts);
    return { mat, pts };
  })();

  /* ---------- Chapter 4: sunrise and rising particles ---------- */
  const rise = (() => {
    const n = count(1300, 420);
    const z0 = chapterZ(4);
    const pos = new Float32Array(n * 3), scale = new Float32Array(n), seed = new Float32Array(n), speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rand(-38, 38); pos[i * 3 + 1] = rand(-23, 23); pos[i * 3 + 2] = z0 + rand(-40, 14);
      scale[i] = Math.pow(Math.random(), 2) * 2.4 + 0.5; seed[i] = Math.random(); speed[i] = rand(1.2, 4.2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: RISE_VERT, fragmentShader: RISE_FRAG,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: 7 }, uPR: { value: dpr }, uBoost: { value: 0 },
        uColorA: { value: new THREE.Color() }, uColorB: { value: new THREE.Color() }, uOpacity: { value: 0 }, uFog: { value: 0.022 }
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    pointMats.push(mat);
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    scene.add(pts);

    const sunMat = new THREE.SpriteMaterial({ map: soft, color: 0xff8a3d, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
    const sun = new THREE.Sprite(sunMat);
    sun.position.set(0, -20, z0 - 55);
    sun.scale.set(110, 80, 1);
    scene.add(sun);
    return { mat, pts, sunMat, sun };
  })();

  /* ---------- Frame loop ---------- */
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const mouseWorld = new THREE.Vector3();
  const mouseSmooth = { x: 0, y: 0 };
  const lookTarget = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  const grey = new THREE.Color(0x6d6f78);

  let t = 0, travel = 0, story = 0, pivot = 0, flop = 0, pulse = 0, future = 0;
  let last = performance.now(), raf = 0, running = false;
  let slowFrames = 0;
  let lastRenderedStory = -1;

  resize();
  addEventListener('resize', resize);

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Adaptive resolution: if frames stay slow, drop the pixel ratio once
    if (dt > 0.034) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && dpr > 1) {
      dpr = 1;
      renderer.setPixelRatio(dpr);
      W = 0; resize();
      slowFrames = 0;
    }

    if (!reduced) t += dt;
    const ease = reduced ? 1 : 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
    travel += ((D.travel || 0) - travel) * ease * 0.9;
    story += ((D.story || 0) - story) * ease * 0.8;
    pivot += ((D.pivot || 0) - pivot) * ease;
    flop += ((D.flop || 0) - flop) * ease * 0.5;
    future += ((D.future || 0) - future) * ease;
    if (D.pulse) { pulse = Math.max(pulse, D.pulse); D.pulse = 0; }
    pulse *= reduced ? 0 : Math.pow(0.25, dt);
    mouseSmooth.x += (D.mouse.x - mouseSmooth.x) * ease * 0.6;
    mouseSmooth.y += (D.mouse.y - mouseSmooth.y) * ease * 0.6;

    // In Chapter 2 the world stays in Discord mode until the dial is turned
    const w2raw = clamp(1 - Math.abs(story - 2), 0, 1);
    const eff = story - w2raw * (1 - pivot);

    // Reduced motion: only re-render when the story position actually moves
    if (reduced && Math.abs(eff - lastRenderedStory) < 0.002) return;
    lastRenderedStory = eff;

    mix(eff);
    scene.background.copy(cur.bg);
    scene.fog.color.copy(cur.fog);
    scene.fog.density = cur.density;

    // Camera: travels forward with the story, drifts, and follows the mouse
    const camZ = CAM_START - travel * CAM_STEP;
    const cx = Math.sin(t * 0.09) * 1.4 + mouseSmooth.x * 2.4;
    const cy = Math.cos(t * 0.11) * 0.9 + mouseSmooth.y * 1.5;
    camera.position.set(cx, cy, camZ);
    lookTarget.set(cx * 0.25 + mouseSmooth.x * 1.2, cy * 0.25 + mouseSmooth.y * 0.8, camZ - 22);
    camera.lookAt(lookTarget);
    camera.rotation.z += Math.sin(t * 0.07) * 0.012;

    // Mouse → world point on a plane in front of the camera
    ndc.set(mouseSmooth.x, mouseSmooth.y);
    raycaster.setFromCamera(ndc, camera);
    plane.constant = -(camZ - 16);
    raycaster.ray.intersectPlane(plane, mouseWorld);

    const w1 = weight(eff, 1), w2 = weight(eff, 2), w3 = weight(eff, 3);
    const w4 = Math.max(weight(eff, 4), smooth(eff - 4));

    // Particle field
    field.uniforms.uTime.value = t;
    field.uniforms.uMouse.value.copy(mouseWorld);
    field.uniforms.uColorA.value.copy(cur.p);
    field.uniforms.uColorB.value.copy(cur.a);
    field.uniforms.uFog.value = cur.density * 0.9;
    field.uniforms.uOpacity.value = 0.9 + pulse * 0.4;

    // Glyphs
    for (const s of glyphs) {
      const u = s.userData;
      s.position.y += u.vy * dt * (1 + pulse * 3);
      if (s.position.y > 19) s.position.y = -19;
      s.position.x += Math.sin(t * u.sway + u.phase) * dt * 0.3;
      s.material.rotation = Math.sin(t * 0.3 + u.phase) * 0.15;
      tmpColor.copy(cur.a).lerp(cur.b, u.tint);
      s.material.color.copy(tmpColor);
      s.material.opacity = u.base * (0.8 + w3 * 0.6) + pulse * 0.3;
    }

    // Wireframes
    for (const l of wires) {
      const u = l.userData;
      l.rotation.x += u.rx * dt * (1 + pulse);
      l.rotation.y += u.ry * dt * (1 + pulse);
      l.position.y = u.baseY + Math.sin(t * 0.4 + u.phase) * 0.8;
      l.material.color.copy(cur.b).lerp(cur.a, 0.5 + 0.5 * Math.sin(t * 0.3 + u.phase));
      l.material.opacity = 0.35 + w2 * 0.35 + pulse * 0.2;
    }

    // Solids + lights
    for (const m of solids) {
      const u = m.userData;
      m.rotation.x += u.r.x * dt;
      m.rotation.y += u.r.y * dt;
      m.position.y = u.baseY + Math.sin(t * 0.5 + u.phase) * 0.6;
    }
    solidMat.emissive.copy(cur.glow).multiplyScalar(0.35);
    mouseLight.position.copy(mouseWorld).setZ(mouseWorld.z + 5);
    mouseLight.color.copy(cur.a);
    mouseLight.intensity = 380 + pulse * 500;
    rimLight.position.set(-cx * 3 - 14, 12, camZ - 26);
    rimLight.color.copy(cur.b);

    // Fog volumes
    for (const f of fogs) {
      const u = f.userData;
      f.material.color.copy(cur.glow);
      f.material.opacity = u.base * (0.8 + 0.25 * Math.sin(t * 0.2 + u.phase));
      f.position.x = u.bx + Math.sin(t * 0.05 + u.phase) * 4;
    }

    // Chapter 1: bubbles (sink and grey out once the chat flops)
    bubbles.visible = w1 > 0.001;
    if (bubbles.visible) {
      bubbles.children.forEach((g, i) => {
        const u = g.userData;
        const drift = (t * u.vy + u.phase * 3) % 22;
        g.position.y = u.baseY + drift - 11 - flop * 6 * (0.5 + (i % 3) * 0.25);
        g.rotation.z = Math.sin(t * 0.5 + u.phase) * 0.08 - flop * 0.25 * (i % 2 ? 1 : -1);
        const m = bubbleMats[i];
        tmpColor.copy(cur.a).lerp(grey, flop * 0.85);
        m.fillMat.color.copy(tmpColor);
        m.edgeMat.color.copy(tmpColor).lerp(cur.b, 0.3 * (1 - flop));
        const fade = w1 * (1 - flop * 0.55);
        m.fillMat.opacity = 0.32 * fade;
        m.edgeMat.opacity = 0.85 * fade;
        m.barMat.opacity = 0.5 * fade;
      });
    }

    // Chapter 2: studio
    studio.visible = w2 > 0.001;
    if (studio.visible) {
      for (const [m, base] of studioMats) m.opacity = base * w2;
      const scan = studio.userData.scan;
      scan.position.y = Math.sin(t * 0.5) * 12;
    }

    // Chapter 3: code rain
    rain.pts.visible = w3 > 0.001;
    if (rain.pts.visible) {
      const u = rain.mat.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = w3;
      u.uBoost.value = pulse;
      u.uColor.value.copy(cur.a);
      u.uFog.value = cur.density * 0.85;
    }

    // Chapter 4: sunrise
    rise.pts.visible = w4 > 0.001;
    const sunUp = smooth((eff - 3.2) / 0.9);
    if (rise.pts.visible) {
      const u = rise.mat.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = w4 * (0.9 + future * 0.5);
      u.uBoost.value = future + pulse * 0.5;
      u.uColorA.value.copy(cur.a);
      u.uColorB.value.copy(cur.b);
      u.uFog.value = cur.density * 0.8;
    }
    rise.sun.visible = sunUp > 0.001;
    rise.sunMat.opacity = sunUp * (0.55 + future * 0.25);
    rise.sunMat.color.copy(cur.a);
    rise.sun.position.y = -24 + sunUp * 6 + future * 3;

    renderer.render(scene, camera);
    if (!running) {
      running = true;
      document.documentElement.classList.add('has-world');
    }
  }

  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if (!document.hidden) start();

  D.world = { renderer, scene, camera };
}

init();
