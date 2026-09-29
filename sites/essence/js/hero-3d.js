/* ==========================================================================
   ESSENCE — Three.js hero
   A glass flacon with a glowing liquid, transmission-glass orbs, rising
   petals, a soft reflective ground and a gradient sky. No postprocessing.
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});

  const C = {
    cream: '#FAF5EE', blush: '#F6D9E0', lavender: '#DCD3F2',
    plum: '#2A1B2E', rosewood: '#6E4A5A', gold: '#C9A227'
  };

  function srgb(THREE, tex) {
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function canvasTexture(THREE, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return srgb(THREE, t);
  }

  /* Smooth rounded box: a subdivided cube whose outer segments are wrapped
     onto quarter-circle edges, so normals stay continuous (no faceting). */
  function roundedBox(THREE, w, h, d, r, k) {
    const N = 2 * k + 1;
    const g = new THREE.BoxGeometry(1, 1, 1, N, N, N);
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const half = [w / 2, h / 2, d / 2];
    const lim = k / N;
    const mid = 0.5 - lim;
    const c = [0, 0, 0], inner = [0, 0, 0];
    const v = new THREE.Vector3(), n = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      c[0] = pos.getX(i); c[1] = pos.getY(i); c[2] = pos.getZ(i);
      for (let a = 0; a < 3; a++) {
        const u = c[a];
        const s = u < 0 ? -1 : 1;
        const e = 0.5 - Math.abs(u);
        const hi = half[a] - r;
        if (e < lim - 1e-6) {
          const t = e / lim;
          c[a] = s * (hi + r * (1 - t));
          inner[a] = s * hi;
        } else {
          c[a] = (u / mid) * hi;
          inner[a] = c[a];
        }
      }
      v.set(c[0], c[1], c[2]);
      n.set(c[0] - inner[0], c[1] - inner[1], c[2] - inner[2]);
      if (n.lengthSq() < 1e-10) n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
      n.normalize();
      v.set(inner[0] + n.x * r, inner[1] + n.y * r, inner[2] + n.z * r);
      pos.setXYZ(i, v.x, v.y, v.z);
      nor.setXYZ(i, n.x, n.y, n.z);
    }
    pos.needsUpdate = true; nor.needsUpdate = true;
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }

  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function init(opts) {
    const THREE = window.THREE;
    const hero = document.querySelector('.hero');
    const canvas = hero && hero.querySelector('.hero-canvas');
    if (!THREE || !canvas) return null;

    const reduced = !!(opts && opts.reduced);
    const small = () => window.innerWidth < 760;
    const isSmall = small();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: false, powerPreference: 'high-performance' });
    } catch (err) {
      return null;
    }
    if (!renderer || !renderer.getContext()) return null;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(C.cream, 1);

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color('#EFE2EC');
    scene.fog = new THREE.Fog(fogColor, 16, 44);

    /* ---------- Sky ---------- */
    const skyTex = canvasTexture(THREE, 4, 1024, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0.0, C.cream);
      g.addColorStop(0.26, '#F9EDEA');
      g.addColorStop(0.42, C.blush);
      g.addColorStop(0.5, '#EADAEC');
      g.addColorStop(0.545, C.lavender);
      g.addColorStop(0.68, '#EEE7F3');
      g.addColorStop(1.0, C.cream);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(80, 48, 24),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false })
    );
    sky.renderOrder = -10;
    scene.add(sky);

    // Soft sun halo behind the bottle — the "bloom" without postprocessing
    const haloTex = canvasTexture(THREE, 256, 256, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.25, 'rgba(255,247,245,0.7)');
      g.addColorStop(0.55, 'rgba(246,217,224,0.28)');
      g.addColorStop(1, 'rgba(246,217,224,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
    });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, depthWrite: false, fog: false, toneMapped: false, transparent: true }));
    halo.scale.set(11, 11, 1);
    halo.position.set(0, 2.4, -7);
    scene.add(halo);

    /* ---------- Environment (for glass reflections) ---------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const envSky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide }));
    envScene.add(envSky);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const softbox1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), boxMat);
    softbox1.position.set(-5, 5, 5); softbox1.lookAt(0, 0, 0);
    const softbox2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.blush), side: THREE.DoubleSide }));
    softbox2.position.set(6, 2, -2); softbox2.lookAt(0, 0, 0);
    const softbox3 = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lavender), side: THREE.DoubleSide }));
    softbox3.position.set(0, 6, -6); softbox3.lookAt(0, 0, 0);
    envScene.add(softbox1, softbox2, softbox3);
    const envRT = pmrem.fromScene(envScene, 0.035);
    scene.environment = envRT.texture;

    /* ---------- Lights ---------- */
    const key = new THREE.DirectionalLight(new THREE.Color('#FFE9EC'), 2.4);
    key.position.set(4, 7, 6);
    const rim = new THREE.DirectionalLight(new THREE.Color(C.lavender), 3.2);
    rim.position.set(-4, 5, -7);
    const hemi = new THREE.HemisphereLight(new THREE.Color(C.cream), new THREE.Color(C.lavender), 0.9);
    scene.add(key, rim, hemi, new THREE.AmbientLight(new THREE.Color(C.blush), 0.25));

    /* ---------- Ground ---------- */
    const groundTex = canvasTexture(THREE, 512, 512, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, C.blush);
      g.addColorStop(0.18, '#F8E3E5');
      g.addColorStop(0.45, C.cream);
      g.addColorStop(0.8, '#F1E9F3');
      g.addColorStop(1, '#EFE2EC');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
    });
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(44, 96),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.22, metalness: 0, transparent: true, opacity: 0.86, envMapIntensity: 0.55 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.renderOrder = 2;
    scene.add(ground);

    const shadowTex = canvasTexture(THREE, 256, 256, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(110,74,90,0.42)');
      g.addColorStop(0.45, 'rgba(110,74,90,0.14)');
      g.addColorStop(1, 'rgba(110,74,90,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    shadow.renderOrder = 3;
    scene.add(shadow);

    /* ---------- The bottle ---------- */
    const liquidUniforms = {
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(C.blush) },
      uBottom: { value: new THREE.Color(C.gold) },
      uAlpha: { value: 1 }
    };
    const liquidVert = `
      varying float vY; varying vec3 vN; varying vec3 vV;
      void main() {
        vY = position.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`;
    const liquidFrag = `
      uniform float uTime; uniform vec3 uTop; uniform vec3 uBottom; uniform float uAlpha;
      varying float vY; varying vec3 vN; varying vec3 vV;
      void main() {
        float h = smoothstep(-0.95, 0.5, vY);
        vec3 col = mix(uBottom, uTop, h);
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        col += fres * vec3(0.4, 0.3, 0.34);
        col += 0.05 * sin(uTime * 1.3 + vY * 7.0) * vec3(1.0, 0.85, 0.7);
        col *= 1.04; // a touch of emissive glow
        gl_FragColor = vec4(col, uAlpha);
      }`;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.03,
      transmission: 1, thickness: 0.7, ior: 1.46,
      clearcoat: 1, clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color('#FBEFF2'), attenuationDistance: 4,
      specularIntensity: 1, envMapIntensity: 1.35
    });
    const goldMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(C.gold), metalness: 1, roughness: 0.24, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.4 });
    const liquidMat = new THREE.ShaderMaterial({ uniforms: liquidUniforms, vertexShader: liquidVert, fragmentShader: liquidFrag });

    const labelTex = canvasTexture(THREE, 512, 320, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(250,245,238,0.9)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.lineWidth = 1; ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = C.plum; ctx.textAlign = 'center';
      ctx.font = '600 64px Fraunces, Georgia, serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
      ctx.fillText('ESSENCE', w / 2 + 7, 140);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
      ctx.fillStyle = C.rosewood;
      ctx.font = 'italic 300 34px Fraunces, Georgia, serif';
      ctx.fillText('eau de cuisine', w / 2, 200);
      ctx.fillStyle = C.gold; ctx.fillRect(w / 2 - 40, 226, 80, 2);
      ctx.fillStyle = C.plum;
      ctx.font = '400 20px "Space Mono", monospace';
      ctx.fillText('Nº 01  ·  30 ML', w / 2, 270);
    });

    function buildBottle(mode) {
      const g = new THREE.Group();
      const reflect = mode === 'reflect';
      const glass = reflect ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }) : glassMat;
      const gold = reflect ? new THREE.MeshBasicMaterial({ color: new THREE.Color(C.gold), transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }) : goldMat;
      const liquid = reflect
        ? new THREE.ShaderMaterial({ uniforms: Object.assign({}, liquidUniforms, { uAlpha: { value: 0.32 } }), vertexShader: liquidVert, fragmentShader: liquidFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide })
        : liquidMat;

      const body = new THREE.Mesh(roundedBox(THREE, 1.9, 2.2, 1.02, 0.3, isSmall ? 4 : 6), glass);
      const juice = new THREE.Mesh(roundedBox(THREE, 1.62, 1.34, 0.74, 0.2, 4), liquid);
      juice.position.y = -0.3;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.24, 40, 1, false), glass);
      neck.position.y = 1.18;
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.05, 16, 56), gold);
      collar.rotation.x = Math.PI / 2; collar.position.y = 1.28;
      const cap = new THREE.Mesh(roundedBox(THREE, 0.74, 0.64, 0.74, 0.14, 4), gold);
      cap.position.y = 1.64;
      g.add(juice, body, neck, collar, cap);

      if (!reflect) {
        const label = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.7), new THREE.MeshStandardMaterial({ map: labelTex, transparent: true, roughness: 0.55, metalness: 0 }));
        label.position.set(0, 0.2, 0.513);
        g.add(label);
      }
      return g;
    }

    const bottle = buildBottle('real');
    const bottleBaseY = 1.72;
    bottle.position.y = bottleBaseY;
    scene.add(bottle);

    const reflection = buildBottle('reflect');
    reflection.scale.y = -1;
    reflection.renderOrder = 1;
    reflection.traverse((o) => { o.renderOrder = 1; });
    scene.add(reflection);

    /* ---------- Orbs ---------- */
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0,
      transmission: 1, thickness: 1.1, ior: 1.33,
      iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 480],
      clearcoat: 1, envMapIntensity: 1.5,
      attenuationColor: new THREE.Color(C.lavender), attenuationDistance: 2.4
    });
    const orbGeo = new THREE.SphereGeometry(1, isSmall ? 32 : 56, isSmall ? 20 : 36);
    const orbDefs = [
      [-2.7, 3.0, -0.6, 0.55], [2.5, 3.5, -1.2, 0.36], [2.9, 1.05, 0.9, 0.68],
      [-1.95, 0.75, 1.3, 0.3], [-3.8, 1.8, -2.8, 0.92], [1.2, 4.3, -2.6, 0.26], [4.1, 2.7, -3.6, 0.5]
    ];
    const orbs = (isSmall ? orbDefs.slice(0, 5) : orbDefs).map((d, i) => {
      const m = new THREE.Mesh(orbGeo, orbMat);
      const sx = isSmall ? 0.55 : 1;
      m.userData = { bx: d[0] * sx, by: d[1] + (isSmall ? 0.6 : 0), bz: d[2], s1: 0.25 + (i % 3) * 0.08, s2: 0.32 + (i % 4) * 0.06, ph: i * 1.7 };
      m.scale.setScalar(d[3] * (isSmall ? 0.8 : 1));
      scene.add(m);
      return m;
    });

    /* ---------- Petals ---------- */
    const petalTex = canvasTexture(THREE, 96, 128, (ctx, w, h) => {
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 6);
      ctx.bezierCurveTo(-2, h * 0.62, 8, 12, w / 2, 4);
      ctx.bezierCurveTo(w - 8, 12, w + 2, h * 0.62, w / 2, h - 6);
      ctx.closePath();
      const g = ctx.createRadialGradient(w * 0.45, h * 0.35, 2, w / 2, h / 2, h * 0.62);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(250,232,236,0.95)');
      g.addColorStop(1, 'rgba(214,170,186,0.75)');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(110,74,90,0.12)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(w / 2, h - 10); ctx.quadraticCurveTo(w / 2 + 4, h / 2, w / 2, 16); ctx.stroke();
    });
    const PETALS = isSmall ? 70 : 150;
    const petalMesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.13, 0.17),
      new THREE.MeshBasicMaterial({ map: petalTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: 0.92 }),
      PETALS
    );
    petalMesh.renderOrder = 5;
    const tints = [C.cream, C.blush, C.lavender, '#FFFFFF', '#EBD89F'].map((h) => new THREE.Color(h));
    const petals = [];
    for (let i = 0; i < PETALS; i++) {
      petals.push({
        r: 1.3 + Math.random() * (isSmall ? 3.2 : 6),
        a: Math.random() * Math.PI * 2,
        y: -0.4 + Math.random() * 8,
        v: 0.12 + Math.random() * 0.26,
        orbit: (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.05),
        sw: 0.5 + Math.random() * 0.8,
        ph: Math.random() * 10,
        rx: 0.3 + Math.random() * 0.9,
        ry: 0.2 + Math.random() * 0.7,
        s: 0.6 + Math.random() * 0.9
      });
      petalMesh.setColorAt(i, tints[i % tints.length]);
    }
    if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
    scene.add(petalMesh);
    const dummy = new THREE.Object3D();

    /* ---------- Camera ---------- */
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const target = new THREE.Vector3(0, 1.95, 0);
    let baseR = isSmall ? 17.5 : 10;
    const basePitch = -0.075;

    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      baseR = small() ? 17.5 : w / h < 1.3 ? 11 : 10;
      // Frame the bottle: right of centre on desktop, higher on mobile
      if (small()) camera.setViewOffset(w, h, 0, h * 0.25, w, h);
      else camera.setViewOffset(w, h, -w * (w > 1100 ? 0.25 : 0.19), h * 0.02, w, h);
      camera.updateProjectionMatrix();
    }
    resize();

    /* ---------- State ---------- */
    let mx = 0, my = 0, cx = 0, cy = 0;
    let progress = 0, progressSmooth = 0;
    let running = false, visible = true, raf = 0;
    const clock = new THREE.Clock();
    let t = 0;
    const introStart = performance.now();

    function onPointer(e) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }
    if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

    function update(dt) {
      t += dt;
      const k = 1 - Math.pow(0.0015, dt); // frame-rate independent lerp
      cx += (mx - cx) * k;
      cy += (my - cy) * k;
      progressSmooth += (progress - progressSmooth) * Math.min(1, k * 2.2);
      const p = progressSmooth;

      const intro = reduced ? 1 : easeOutExpo(Math.min(1, (performance.now() - introStart) / 900));

      // Camera: orbit ±0.15 rad toward pointer, dolly back on scroll
      const yaw = cx * 0.15;
      const pitch = basePitch + cy * 0.06;
      const R = baseR + p * 6;
      camera.position.set(
        target.x + Math.sin(yaw) * Math.cos(pitch) * R,
        target.y + Math.sin(pitch) * R + p * 0.8,
        target.z + Math.cos(yaw) * Math.cos(pitch) * R
      );
      camera.lookAt(target.x, target.y - p * 0.6, target.z);

      // Bottle: bob, sway, sink + shrink on scroll, scale up on intro
      const bob = reduced ? 0 : Math.sin(t * 0.9) * 0.12;
      const s = (0.72 + 0.28 * intro) * (1 - p * 0.32);
      bottle.scale.setScalar(s);
      bottle.position.y = bottleBaseY + bob - p * 1.4;
      bottle.rotation.y = -0.38 + Math.sin(t * 0.22) * 0.62 + cx * 0.12;
      bottle.rotation.z = Math.sin(t * 0.5) * 0.025;

      reflection.scale.set(s, -s, s);
      reflection.position.y = -bottle.position.y;
      reflection.rotation.y = bottle.rotation.y;
      reflection.rotation.z = -bottle.rotation.z;

      const lift = bottle.position.y - (1.1 * s);
      const sh = Math.max(0.3, 1.25 - lift * 0.35);
      shadow.scale.set(sh * s, sh * s, 1);
      shadow.material.opacity = Math.max(0.15, 1 - lift * 0.3);

      liquidUniforms.uTime.value = t;

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i], d = o.userData;
        o.position.set(
          d.bx + Math.sin(t * d.s1 + d.ph) * 0.28,
          d.by + Math.sin(t * d.s2 + d.ph * 1.3) * 0.36 - p * 0.8,
          d.bz + Math.cos(t * d.s1 * 0.7 + d.ph) * 0.22
        );
      }

      for (let i = 0; i < petals.length; i++) {
        const q = petals[i];
        if (!reduced) {
          q.y += q.v * dt;
          q.a += q.orbit * dt;
          if (q.y > 7.8) { q.y = -0.3; q.a = Math.random() * Math.PI * 2; }
        }
        const sway = Math.sin(t * q.sw + q.ph) * 0.3;
        dummy.position.set(Math.cos(q.a) * q.r + sway, q.y, Math.sin(q.a) * q.r - 0.5);
        dummy.rotation.set(t * q.rx + q.ph, t * q.ry, Math.sin(t + q.ph) * 0.7);
        const fade = smooth(-0.3, 0.5, q.y) * (1 - smooth(6.6, 7.8, q.y));
        dummy.scale.setScalar(q.s * fade * intro + 0.0001);
        dummy.updateMatrix();
        petalMesh.setMatrixAt(i, dummy.matrix);
      }
      petalMesh.instanceMatrix.needsUpdate = true;
    }

    let firstFrame = true;
    function render() {
      renderer.render(scene, camera);
      if (firstFrame) {
        firstFrame = false;
        hero.classList.add('is-3d');
      }
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      update(Math.min(clock.getDelta(), 0.05));
      render();
    }

    function start() {
      if (running || reduced) return;
      running = true;
      clock.getDelta();
      loop();
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // Pause when the hero is off-screen or the tab is hidden
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (visible) start();
    });

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => { resize(); if (reduced || !running) { update(0); render(); } }, 120);
    });

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      stop();
      hero.classList.remove('is-3d');
    });

    // Reduced motion: one static, composed frame
    update(reduced ? 0.0001 : 0.016);
    render();
    if (!reduced) start();

    return {
      setProgress(v) {
        progress = Math.min(1, Math.max(0, v));
        if (reduced) { progressSmooth = progress; update(0); render(); }
      }
    };
  }

  E.hero = { init };
})();
