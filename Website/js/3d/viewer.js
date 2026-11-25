/* Viewer for the DS Concept House: renderer, light, camera, picking,
   tour, explode, cut-away, floors, materials and the side panel. */
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/addons/RoomEnvironment.js';
import { makeMaterials } from './builder.js';
import { buildHouse, ROOMS } from './house.js';
import { tex } from './textures.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const PRESETS = {
  corner: { pos: [21, 11, 26.5], tgt: [-0.6, 4.4, 0.4], label: 'Corner' },
  street: { pos: [2, 3.2, 31], tgt: [0, 5, 0], label: 'Street' },
  garden: { pos: [-17, 13, -23.5], tgt: [-1.5, 3.4, -1], label: 'Garden' },
  aerial: { pos: [0.5, 46, 22], tgt: [0, 2, -0.5], label: 'Aerial' },
  plan: { pos: [0, 52, 0.01], tgt: [0, 0, 0], label: 'Plan' },
  lobby: { pos: [-0.45, 1.6, 1.45], tgt: [1.4, 4.1, -2.4], label: 'Lobby' }
};

const TOUR = [
  { cap: 'Arrival. A plaster-and-stone boundary wall, a slatted sliding gate, and a stepping-stone path to the marble entrance canopy.', pos: [3, 2.6, 24], tgt: [1, 3.2, 6], floor: 'all', cut: 1 },
  { cap: 'The façade. A white Statuario frame cantilevers over the veranda; beside it, a teak-clad bedroom behind vertical louvres; above, the stone-clad theatre under a projecting cap.', pos: [15, 8, 22], tgt: [0, 5.2, 4], floor: 'all', cut: 1 },
  { cap: 'Living & dining. Opened up from above: a double-aspect living room to the pool deck, eight-seat dining and the island kitchen beyond.', pos: [-13, 17, 8], tgt: [-3.5, 0.5, -1.5], floor: 'L0', cut: 1 },
  { cap: 'The lobby. A floating walnut stair cantilevered from a stone wall, a glass lift and a crystal chandelier over two floors.', pos: [-0.3, 2.4, 4.6], tgt: [1.8, 3.4, -2.4], floor: 'all', cut: 1 },
  { cap: 'Master suite. Inside the marble frame: full-height glass, a balcony over the street and a walk-in wardrobe behind the bed wall.', pos: [-12, 15, 12], tgt: [-3.6, 3.8, 1.5], floor: 'L1', cut: 1 },
  { cap: 'Terrace garden. A planted deck under a timber pergola, the home theatre beside it and a jacuzzi terrace at the back.', pos: [-15, 16, 17], tgt: [-1.5, 7.4, 1.5], floor: 'L2', cut: 1 }
];

export function createViewer(root, mode = 'full') {
  const full = mode === 'full';
  root.classList.add('x3d-ready', full ? 'x3d-full' : 'x3d-hero');
  root.innerHTML = template(full);
  // paint each material swatch from its real procedural texture
  root.querySelectorAll('.x3d-sw i[data-tex]').forEach((i) => {
    const src = tex(i.dataset.tex).image, c = document.createElement('canvas'); c.width = c.height = 48;
    c.getContext('2d').drawImage(src, 0, 0, src.width / 3, src.height / 3, 0, 0, 48, 48);
    i.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.8)})`;
  });
  const stage = root.querySelector('.x3d-stage');
  const loader = root.querySelector('.x3d-loader');
  const caption = root.querySelector('.x3d-caption');
  const pinsLayer = root.querySelector('.x3d-pins');

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D model of the DS Concept House');
  renderer.domElement.tabIndex = 0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const heroBg = new THREE.Color(root.dataset.bg || '#211c1e');
  scene.fog = full ? new THREE.Fog(0xd6e0e6, 85, 210) : new THREE.Fog(heroBg.getHex(), 34, 66);

  const camera = new THREE.PerspectiveCamera(full ? 36 : 32, 1, 0.25, 320);
  camera.position.set(...PRESETS.corner.pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...PRESETS.corner.tgt);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.minDistance = 3; controls.maxDistance = 85;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.screenSpacePanning = true;
  if (!full) {
    controls.enableZoom = false; controls.enablePan = false;
    controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 0.55;
    camera.position.set(26, 11.5, 29); controls.target.set(-0.5, 4.3, 0);
    // On touch screens the hero must never trap the page scroll
    if (matchMedia('(pointer: coarse)').matches) { controls.enabled = false; renderer.domElement.style.touchAction = 'pan-y'; }
  }
  controls.update();

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xe6eef4, 0x5d5a4c, 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2de, 3.0);
  sun.castShadow = true;
  const maxTex = renderer.capabilities.maxTextureSize, shadowRes = full ? Math.min(4096, maxTex) : 2048;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 20, far: 130 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.045; sun.shadow.radius = 2.5; sun.shadow.blurSamples = 12;
  scene.add(sun, sun.target);

  /* ---------- the house ---------- */
  const M = makeMaterials();
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 100);
  for (const m of Object.values(M)) if (m.userData.building) m.clippingPlanes = [cutPlane];
  const H = buildHouse(M, { interiors: full });
  scene.add(H.root);
  const levelOrder = ['L0', 'L1', 'L2', 'roof'];
  const proxies = H.proxies;

  /* hover box */
  const hl = new THREE.Group(); hl.visible = false; scene.add(hl);
  const hlBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x7a2e5c, transparent: true, opacity: 0.12, depthWrite: false }));
  const hlEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x7a2e5c }));
  hlBox.renderOrder = 5; hlEdge.renderOrder = 6; hl.add(hlBox, hlEdge);

  /* ---------- state ---------- */
  const S = { hour: full ? 11 : Number(root.dataset.hour || 16.7), explode: 0, explodeTarget: 0, cut: 1, floor: 'all', labels: false, hovered: null, selected: null, visible: true, dirty: true, tween: null, tour: -1, tourTimer: 0 };
  const invalidate = () => { S.dirty = true; };

  /* ---------- time of day ---------- */
  const skyKeys = [[6, 0xeec3a0], [7.5, 0xd6e1e8], [12, 0xbfd3e2], [16.5, 0xcfdbe2], [18.2, 0xe6b48c], [19.2, 0x4f546e], [20, 0x161c2a]];
  const sampleSky = (h) => {
    for (let i = 0; i < skyKeys.length - 1; i++) {
      const [h0, c0] = skyKeys[i], [h1, c1] = skyKeys[i + 1];
      if (h <= h1) return new THREE.Color(c0).lerp(new THREE.Color(c1), Math.max(0, (h - h0) / (h1 - h0)));
    }
    return new THREE.Color(skyKeys[skyKeys.length - 1][1]);
  };
  function setHour(h) {
    S.hour = h;
    const t = (h - 6) / 14;                                   // 0 at 06:00, 1 at 20:00
    const elev = Math.sin(Math.PI * Math.min(Math.max((h - 6) / 13, 0), 1));
    const R = 60;
    sun.position.set(-Math.cos(Math.PI * t) * R, Math.max(4, elev * 48), 18 + Math.sin(Math.PI * t) * 22);
    const night = THREE.MathUtils.smoothstep(h, 18.2, 19.6);
    const golden = Math.max(0, 1 - Math.abs(h - 17.6) / 1.4) + Math.max(0, 1 - Math.abs(h - 6.6) / 1.2);
    const warm = new THREE.Color(0xffb27a), white = new THREE.Color(0xfff4e6), moon = new THREE.Color(0x9fb4d8);
    sun.color.copy(white).lerp(warm, Math.min(1, golden)).lerp(moon, night);
    sun.intensity = lerp(lerp(3.3, 2.6, Math.min(1, golden)), 0.3, night);
    hemi.intensity = lerp(0.32, 0.12, night);
    hemi.color.set(night > 0.5 ? 0x5a6a90 : 0xe6eef4);
    scene.environmentIntensity = lerp(0.42, 0.16, night);
    const sky = full ? sampleSky(h) : heroBg; scene.background = sky; scene.fog.color.copy(sky);
    renderer.toneMappingExposure = lerp(1.0, 1.25, night) * (full ? 1 : 0.86);
    // interior glow at night
    M.glass.emissiveIntensity = night * 0.9;
    M.glow.emissiveIntensity = 0.25 + night * 2.2;
    M.crystal.emissiveIntensity = 0.15 + night * 1.8;
    M.lamp.emissiveIntensity = night * 3.0;
    M.water.emissiveIntensity = night * 0.9;
    H.lights.forEach((l) => { l.intensity = Math.max(night, l.userData.day || 0) * l.userData.max; });
    const out = root.querySelector('[data-x3d-out=hour]');
    if (out) out.textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
    root.querySelectorAll('[data-light]').forEach((b) => b.setAttribute('aria-pressed', String(
      (b.dataset.light === 'day' && h >= 9 && h < 16.5) || (b.dataset.light === 'golden' && h >= 16.5 && h < 18.8) || (b.dataset.light === 'night' && h >= 18.8))));
    invalidate();
  }

  /* ---------- floors, explode, cut ---------- */
  function applyLevels() {
    const show = { all: 4, L0: 1, L1: 2, L2: 3 }[S.floor];
    levelOrder.forEach((k, i) => { H.groups[k].visible = i < show; });
    const e = ease(S.explode);
    H.groups.L1.position.y = 3.6 * e; H.groups.L2.position.y = 7.2 * e; H.groups.roof.position.y = 10.8 * e;
    cutPlane.constant = S.cut >= 0.999 ? 100 : lerp(-9.5, 8, S.cut);
    hideHover(); invalidate();
  }
  function setFloor(f) {
    S.floor = f;
    root.querySelectorAll('[data-floor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.floor === f)));
    applyLevels(); refreshPins();
  }

  /* ---------- materials ---------- */
  /* Material options. Each entry: [label, swatch (texture name or #colour), apply()] */
  const T = (m, name, o = {}) => { m.map = name ? tex(name) : null; m.color.set(o.color ?? 0xffffff); if (o.rough !== undefined) m.roughness = o.rough; if (o.metal !== undefined) m.metalness = o.metal; };
  const MATS = {
    clad: {
      teak: () => { T(M.clad, 'teak', { rough: .55 }); T(M.louvre, 'teakV', { rough: .5 }); },
      cedar: () => { T(M.clad, 'cedar', { rough: .6 }); T(M.louvre, 'cedarV', { rough: .55 }); },
      walnut: () => { T(M.clad, 'walnut', { rough: .5 }); T(M.louvre, 'walnutV', { rough: .5 }); },
      charred: () => { T(M.clad, 'charred', { rough: .8 }); T(M.louvre, 'charredV', { rough: .8 }); },
      stone: () => { T(M.clad, 'stone', { rough: .85 }); T(M.louvre, 'stone', { rough: .85 }); },
      concrete: () => { T(M.clad, 'concrete', { rough: .9 }); T(M.louvre, 'concrete', { rough: .9 }); },
      brick: () => { T(M.clad, 'brick', { rough: .9 }); T(M.louvre, 'cedarV', { rough: .55 }); }
    },
    frame: {
      marble: () => T(M.frame, 'marble', { rough: .28 }),
      plaster: () => T(M.frame, 'plaster', { rough: .9 }),
      travertine: () => T(M.frame, 'travertine', { rough: .55 }),
      concrete: () => T(M.frame, 'concrete', { rough: .9 }),
      whitebrick: () => T(M.frame, 'brickWhite', { rough: .85 }),
      charcoal: () => T(M.frame, 'plaster', { color: 0x3a3a3c, rough: .7 })
    },
    mullion: {
      black: () => T(M.mullion, null, { color: 0x2b2c2e, rough: .38, metal: .55 }),
      bronze: () => T(M.mullion, null, { color: 0x6b4e33, rough: .35, metal: .7 }),
      champagne: () => T(M.mullion, null, { color: 0xb59e7c, rough: .3, metal: .75 }),
      white: () => T(M.mullion, null, { color: 0xeeeeea, rough: .5, metal: .1 }),
      silver: () => T(M.mullion, null, { color: 0xb8bcc0, rough: .28, metal: .85 })
    },
    glass: {
      clear: () => { M.glass.color.set(0xa9c3cb); M.glass.opacity = 0.3; M.glass.roughness = 0.04; M.glass.metalness = 0.15; },
      bronze: () => { M.glass.color.set(0x8a6a4a); M.glass.opacity = 0.42; M.glass.roughness = 0.04; M.glass.metalness = 0.2; },
      grey: () => { M.glass.color.set(0x5f666b); M.glass.opacity = 0.48; M.glass.roughness = 0.04; M.glass.metalness = 0.25; },
      blue: () => { M.glass.color.set(0x5e8aa8); M.glass.opacity = 0.42; M.glass.roughness = 0.02; M.glass.metalness = 0.45; },
      frosted: () => { M.glass.color.set(0xe9eef0); M.glass.opacity = 0.72; M.glass.roughness = 0.55; M.glass.metalness = 0.0; }
    },
    floor: {
      mixed: () => { T(M.floorMarble, 'marbleFloor', { rough: .16 }); T(M.floorOak, 'oak', { rough: .45 }); },
      marble: () => { T(M.floorMarble, 'marbleFloor', { rough: .16 }); T(M.floorOak, 'marbleFloor', { rough: .16 }); },
      oak: () => { T(M.floorMarble, 'oak', { rough: .45 }); T(M.floorOak, 'oak', { rough: .45 }); },
      walnut: () => { T(M.floorMarble, 'walnutFloor', { rough: .4 }); T(M.floorOak, 'walnutFloor', { rough: .4 }); },
      ash: () => { T(M.floorMarble, 'ashFloor', { rough: .45 }); T(M.floorOak, 'ashFloor', { rough: .45 }); },
      terrazzo: () => { T(M.floorMarble, 'terrazzo', { rough: .3 }); T(M.floorOak, 'terrazzo', { rough: .3 }); },
      slate: () => { T(M.floorMarble, 'slate', { rough: .6 }); T(M.floorOak, 'slate', { rough: .6 }); }
    },
    timber: {
      teak: () => { T(M.timber, 'teak', { color: 0xf0e6dc, rough: .6 }); T(M.deck, 'deck', { rough: .7 }); },
      cedar: () => { T(M.timber, 'cedar', { rough: .6 }); T(M.deck, 'cedar', { rough: .7 }); },
      walnut: () => { T(M.timber, 'walnut', { rough: .55 }); T(M.deck, 'walnutFloor', { rough: .65 }); },
      charred: () => { T(M.timber, 'charred', { rough: .8 }); T(M.deck, 'charred', { rough: .85 }); },
      white: () => { T(M.timber, 'plaster', { color: 0xf2f0ec, rough: .7 }); T(M.deck, 'ashFloor', { rough: .7 }); }
    },
    boundary: {
      stone: () => { T(M.wallSite, 'plaster', { rough: .92 }); T(M.stoneSite, 'stone', { rough: .86 }); },
      concrete: () => { T(M.wallSite, 'concrete', { rough: .9 }); T(M.stoneSite, 'concrete', { rough: .9 }); },
      brick: () => { T(M.wallSite, 'brick', { rough: .9 }); T(M.stoneSite, 'brick', { rough: .9 }); },
      travertine: () => { T(M.wallSite, 'plaster', { rough: .92 }); T(M.stoneSite, 'travertine', { rough: .6 }); }
    }
  };
  function setMaterial(kind, val) {
    MATS[kind][val]();
    for (const m of Object.values(M)) m.needsUpdate = true;
    root.querySelectorAll(`[data-mat="${kind}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === val)));
    invalidate();
  }

  /* ---------- camera moves ---------- */
  function flyTo(pos, tgt, dur = 1.5) {
    if (reduceMotion) { camera.position.set(...pos); controls.target.set(...tgt); controls.update(); invalidate(); return; }
    S.tween = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...tgt) };
  }
  function preset(name) {
    const p = PRESETS[name]; stopTour();
    if (name === 'plan') setFloor('L0');
    else if (S.floor !== 'all' && (S.planFloor || name === 'lobby' || name === 'street')) setFloor('all');
    S.planFloor = name === 'plan';
    flyTo(p.pos, p.tgt);
    root.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === name)));
  }

  /* ---------- tour ---------- */
  function showStop(i) {
    S.tour = (i + TOUR.length) % TOUR.length; S.tourTimer = 0;
    const st = TOUR[S.tour];
    setFloor(st.floor); S.cut = st.cut; syncCutInput(); applyLevels();
    flyTo(st.pos, st.tgt, 2.2);
    caption.querySelector('p').textContent = st.cap;
    caption.querySelector('span').textContent = `${S.tour + 1} / ${TOUR.length}`;
    caption.hidden = false;
  }
  function startTour() { controls.autoRotate = false; showStop(0); setTourButton(true); }
  function stopTour() { if (S.tour < 0) return; S.tour = -1; caption.hidden = true; setTourButton(false); }
  function setTourButton(on) { const b = root.querySelector('[data-x3d=tour]'); if (b) { b.setAttribute('aria-pressed', String(on)); b.querySelector('span').textContent = on ? 'Stop tour' : 'Guided tour'; } }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const isShown = (o) => { for (let p = o.parent; p; p = p.parent) if (!p.visible) return false; return true; };
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(proxies.filter(isShown), false);
    // ignore anything on the cut-away side
    return (hits.find((h) => h.point.z <= cutPlane.constant + 0.01) || {}).object || null;
  }
  function showHover(o) {
    if (!o) return hideHover();
    if (S.hovered === o) return;
    S.hovered = o;
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    hl.position.copy(c); hl.scale.copy(size).addScalar(0.05); hl.visible = true;
    renderer.domElement.style.cursor = 'pointer';
    const tip = root.querySelector('.x3d-tip'); if (tip) { tip.textContent = o.userData.name; tip.hidden = false; }
    invalidate();
  }
  function hideHover() {
    if (!S.hovered && !hl.visible) return;
    S.hovered = null; hl.visible = false; renderer.domElement.style.cursor = '';
    const tip = root.querySelector('.x3d-tip'); if (tip) tip.hidden = true;
    invalidate();
  }
  function select(o) {
    S.selected = o;
    const card = root.querySelector('.x3d-card');
    if (!card) return;
    if (!o) { card.innerHTML = defaultCard(); return; }
    const d = o.userData;
    card.innerHTML = `<span class="x3d-k">${d.kind === 'room' ? 'Room' : 'Element'}${d.size ? ' · ' + d.size : ''}</span>
      <h4>${d.name}</h4><p>${d.text}</p>
      <a class="x3d-link" href="${d.link}">${d.linkLabel} <span aria-hidden="true">↗</span></a>`;
    card.classList.remove('x3d-flash'); void card.offsetWidth; card.classList.add('x3d-flash');
  }

  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; if (S.tour >= 0 && full) stopTour(); if (!full) controls.autoRotate = false; });
  renderer.domElement.addEventListener('pointermove', (e) => { if (e.buttons) return; if (full) showHover(pick(e)); });
  renderer.domElement.addEventListener('pointerleave', hideHover);
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5 || !full) return;
    const o = pick(e); select(o); showHover(o);
  });
  renderer.domElement.addEventListener('dblclick', (e) => {
    if (!full) return; const o = pick(e); if (!o) return;
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls.target).normalize();
    flyTo(c.clone().add(dir.multiplyScalar(11)).toArray(), c.toArray(), 1.2);
  });
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', () => { root.classList.add('x3d-interacted'); });

  /* ---------- labels ---------- */
  const pinData = ROOMS.filter((r) => r[4] === 'room').map((r) => ({ id: r[0], name: r[1], group: r[2], pos: new THREE.Vector3((r[3][0] + r[3][3]) / 2, r[3][1] + 1.6, (r[3][2] + r[3][5]) / 2) }));
  function refreshPins() {
    pinsLayer.innerHTML = S.labels ? pinData.map((p) => `<button type="button" class="x3d-pin" data-pin="${p.id}">${p.name}</button>`).join('') : '';
    pinsLayer.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', () => { const o = proxies.find((x) => x.userData.id === b.dataset.pin); select(o); showHover(o); }));
    invalidate();
  }
  const v = new THREE.Vector3();
  function placePins() {
    if (!S.labels) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    pinsLayer.querySelectorAll('[data-pin]').forEach((el) => {
      const p = pinData.find((q) => q.id === el.dataset.pin);
      const g = H.groups[p.group];
      v.copy(p.pos); v.y += g.position.y;
      const shown = isShown(proxies.find((x) => x.userData.id === p.id)) && g.visible;
      v.project(camera);
      const on = shown && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && p.pos.z <= cutPlane.constant + 2;
      el.style.display = on ? '' : 'none';
      if (on) el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    });
  }

  /* ---------- panel wiring ---------- */
  const on = (sel, ev, fn) => root.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, fn));
  on('[data-preset]', 'click', (e) => preset(e.currentTarget.dataset.preset));
  on('[data-x3d=tour]', 'click', () => (S.tour >= 0 ? stopTour() : startTour()));
  on('[data-x3d=next]', 'click', () => showStop(S.tour + 1));
  on('[data-x3d=prev]', 'click', () => showStop(S.tour - 1));
  on('[data-x3d=close-tour]', 'click', stopTour);
  on('[data-light]', 'click', (e) => { const h = { day: 11, golden: 17.6, night: 19.6 }[e.currentTarget.dataset.light]; animateHour(h); });
  on('[data-x3d-in=hour]', 'input', (e) => setHour(Number(e.target.value)));
  on('[data-x3d=explode]', 'click', (e) => { S.explodeTarget = S.explodeTarget ? 0 : 1; e.currentTarget.setAttribute('aria-pressed', String(!!S.explodeTarget)); if (S.explodeTarget && camera.position.y < 12) flyTo([28, 22, 30], [0, 7, 0]); });
  on('[data-x3d-in=cut]', 'input', (e) => { S.cut = Number(e.target.value); applyLevels(); });
  on('[data-floor]', 'click', (e) => { setFloor(e.currentTarget.dataset.floor); if (e.currentTarget.dataset.floor !== 'all' && camera.position.y < 14) flyTo([16, 22, 20], [0, LV(e.currentTarget.dataset.floor), 0]); });
  on('[data-x3d=labels]', 'click', (e) => { S.labels = !S.labels; e.currentTarget.setAttribute('aria-pressed', String(S.labels)); refreshPins(); });
  on('[data-mat]', 'click', (e) => setMaterial(e.currentTarget.dataset.mat, e.currentTarget.dataset.val));
  on('[data-x3d=reset]', 'click', () => { stopTour(); S.explodeTarget = 0; S.cut = 1; syncCutInput(); setFloor('all'); setHour(11); syncHourInput(); preset('corner'); select(null); root.querySelector('[data-x3d=explode]')?.setAttribute('aria-pressed', 'false'); });
  on('[data-x3d=fullscreen]', 'click', () => { document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.(); });
  on('[data-x3d=snapshot]', 'click', () => { renderNow(); const a = document.createElement('a'); a.download = 'ds-concept-house.png'; a.href = renderer.domElement.toDataURL('image/png'); a.click(); });
  function LV(f) { return { L0: 0.5, L1: 3.8, L2: 7.1 }[f] || 3; }
  function syncCutInput() { const i = root.querySelector('[data-x3d-in=cut]'); if (i) i.value = S.cut; }
  function syncHourInput() { const i = root.querySelector('[data-x3d-in=hour]'); if (i) i.value = S.hour; }
  let hourAnim = null;
  function animateHour(h) { if (reduceMotion) { setHour(h); syncHourInput(); return; } hourAnim = { from: S.hour, to: h, t: 0 }; }

  // keyboard: arrows orbit, +/- zoom
  renderer.domElement.addEventListener('keydown', (e) => {
    const r = 0.08, off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    if (e.key === 'ArrowLeft') sph.theta -= r; else if (e.key === 'ArrowRight') sph.theta += r;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.15, sph.phi - r); else if (e.key === 'ArrowDown') sph.phi = Math.min(1.5, sph.phi + r);
    else if (e.key === '+' || e.key === '=') sph.radius = Math.max(4, sph.radius * 0.9); else if (e.key === '-') sph.radius = Math.min(80, sph.radius * 1.1);
    else return;
    e.preventDefault(); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph)); controls.update(); invalidate();
  });

  /* ---------- size, visibility, loop ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // hero: shift the house to the right of the headline on wide screens
    const off = !full && w > 960 ? Number(root.dataset.offset || 0.2) : 0;
    if (off) camera.setViewOffset(w, h, -w * off, 0, w, h); else camera.clearViewOffset();
    // hero on narrow screens: keep the house's width in view by widening the vertical field of view
    { const asp = w / h, base = full ? 36 : 32, ref = full ? 1.25 : 1.5;
      camera.fov = asp < ref ? Math.min(full ? 52 : 46, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(base / 2)) * ref / asp) * 180 / Math.PI) : base; }
    camera.updateProjectionMatrix(); invalidate();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage);
  const io = new IntersectionObserver(([en]) => { S.visible = en.isIntersecting; if (S.visible) invalidate(); }, { rootMargin: '100px' });
  io.observe(root);
  document.addEventListener('fullscreenchange', () => { root.classList.toggle('x3d-fs', document.fullscreenElement === root); setTimeout(resize, 50); });

  function renderNow() { renderer.render(scene, camera); placePins(); S.dirty = false; }
  let last = performance.now(), frames = 0, acc = 0; const stats = { fps: 0, ms: 0 };
  let raf = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!S.visible) return;
    let animating = false;
    if (S.tween) {
      const tw = S.tween; tw.t += dt / tw.dur; const k = ease(Math.min(1, tw.t));
      camera.position.lerpVectors(tw.p0, tw.p1, k); controls.target.lerpVectors(tw.t0, tw.t1, k);
      if (tw.t >= 1) S.tween = null; animating = true;
    }
    if (Math.abs(S.explode - S.explodeTarget) > 0.001) { S.explode += Math.sign(S.explodeTarget - S.explode) * Math.min(Math.abs(S.explodeTarget - S.explode), dt * (reduceMotion ? 99 : 1.1)); applyLevels(); animating = true; }
    if (hourAnim) { hourAnim.t = Math.min(1, hourAnim.t + dt / 1.6); setHour(lerp(hourAnim.from, hourAnim.to, ease(hourAnim.t))); syncHourInput(); if (hourAnim.t >= 1) hourAnim = null; animating = true; }
    if (S.tour >= 0 && !reduceMotion) { S.tourTimer += dt; if (S.tourTimer > 7.5 && !S.tween) showStop(S.tour + 1); }
    if (controls.update()) animating = true;
    if (controls.autoRotate) animating = true;
    if (animating || S.dirty) {
      const t0 = performance.now();
      M.water.map.offset.x = now * 0.000015; M.water.map.offset.y = now * 0.00001;
      renderNow();
      frames++; acc += performance.now() - t0;
      if (frames >= 30) { stats.ms = acc / frames; frames = 0; acc = 0; }
    }
  }

  /* ---------- start ---------- */
  setHour(S.hour); applyLevels(); resize();
  if (full) select(null);
  requestAnimationFrame((t) => { last = t; loop(t); });
  requestAnimationFrame(() => { loader.classList.add('x3d-done'); setTimeout(() => loader.remove(), 700); });

  const api = {
    renderer, scene, camera, controls, stats, H, M, S,
    preset, setHour, setFloor, setMaterial, startTour, stopTour, showStop,
    select: (o) => select(typeof o === 'string' ? proxies.find((x) => x.userData.id === o) || null : o),
    jump: (n) => { const p = PRESETS[n]; S.tween = null; if (n === 'plan') setFloor('L0'); else if (S.planFloor) setFloor('all'); S.planFloor = n === 'plan'; camera.position.set(...p.pos); controls.target.set(...p.tgt); controls.update(); invalidate(); },
    explode: (on1) => { S.explodeTarget = on1 ? 1 : 0; },
    cut: (v1) => { S.cut = v1; syncCutInput(); applyLevels(); },
    labels: (on1) => { S.labels = !!on1; refreshPins(); },
    proxies,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, parts: H.parts, ms: stats.ms }),
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); pmrem.dispose(); scene.traverse((o) => { o.geometry?.dispose(); }); root.innerHTML = ''; }
  };
  root.__x3d = api;
  return api;
}

function defaultCard() {
  return `<span class="x3d-k">Select</span><h4>Click any room or element</h4><p>Hover the model to find rooms and façade elements, click one to read about it, double-click to fly in.</p>`;
}

function template(full) {
  const stageHtml = `
    <div class="x3d-stage">
      <div class="x3d-loader"><svg viewBox="0 0 60 40" aria-hidden="true"><path d="M4 36V4h16a16 16 0 0 1 0 32Z M34 30c3 4 8 6 13 6 6 0 10-3 10-8 0-11-22-6-22-16 0-5 4-8 10-8 5 0 9 2 11 5"/></svg><span>Drawing the house…</span></div>
      <div class="x3d-hud"><span class="x3d-k">The DS Concept House · Original concept</span>${full ? '<span class="x3d-k x3d-nts">N.T.S</span>' : ''}</div>
      <div class="x3d-pins" aria-hidden="false"></div>
      <div class="x3d-tip" hidden></div>
      <div class="x3d-caption" hidden><span class="x3d-k"></span><p></p><div><button type="button" data-x3d="prev" aria-label="Previous stop">‹</button><button type="button" data-x3d="next" aria-label="Next stop">›</button><button type="button" data-x3d="close-tour" aria-label="End tour">✕</button></div></div>
      <div class="x3d-hint">${full ? (matchMedia('(pointer: coarse)').matches ? 'Drag to orbit · Pinch to zoom · Tap a room' : 'Drag to orbit · Scroll or pinch to zoom · Right-drag to pan · Click a room') : 'Drag to rotate'}</div>
    </div>`;
  if (!full) return stageHtml;
  const btn = (attr, label, pressed = false) => `<button type="button" ${attr} aria-pressed="${pressed}">${label}</button>`;
  return stageHtml + `
    <aside data-lenis-prevent class="x3d-panel" aria-label="Model controls">
      <header>
        <span class="x3d-k">Interactive study</span>
        <h3>The DS <em>Concept</em> House</h3>
        <p>An original three-level home in the studio's language: a Statuario frame, teak louvres, a stone-clad theatre, a pergola terrace and a floating stair.</p>
      </header>
      <section><h4>Views</h4>
        <div class="x3d-grid3">${['corner', 'street', 'garden', 'aerial', 'plan', 'lobby'].map((p) => btn(`data-preset="${p}"`, PRESETS[p].label, p === 'corner')).join('')}</div>
        <button type="button" class="x3d-wide" data-x3d="tour" aria-pressed="false"><b aria-hidden="true">▶</b><span>Guided tour</span></button>
      </section>
      <section><h4>Light <output data-x3d-out="hour">11:00</output></h4>
        <input type="range" min="6" max="20" step="0.25" value="11" data-x3d-in="hour" aria-label="Time of day">
        <div class="x3d-grid3">${btn('data-light="day"', 'Day', true)}${btn('data-light="golden"', 'Golden hour')}${btn('data-light="night"', 'Night')}</div>
      </section>
      <section><h4>Explore</h4>
        <div class="x3d-grid2">${btn('data-x3d="explode"', 'Explode levels')}${btn('data-x3d="labels"', 'Room labels')}</div>
        <label class="x3d-label">Cut-away <input type="range" min="0" max="1" step="0.01" value="1" data-x3d-in="cut" aria-label="Cut-away position"></label>
        <div class="x3d-grid4">${btn('data-floor="all"', 'All', true)}${btn('data-floor="L0"', 'Ground')}${btn('data-floor="L1"', 'First')}${btn('data-floor="L2"', 'Second')}</div>
      </section>
      <section><h4>Materials</h4>
        ${MAT_UI.map(([kind, title, opts]) => `<div class="x3d-mats"><span>${title}</span><div>${opts.map(([val, label, sw], k) => swatch(kind, val, label, sw, k === 0)).join('')}</div></div>`).join('')}
      </section>
      <section class="x3d-card" aria-live="polite"></section>
      <footer>
        <div class="x3d-grid3">${btn('data-x3d="reset"', 'Reset')}${btn('data-x3d="fullscreen"', 'Fullscreen')}${btn('data-x3d="snapshot"', 'Save view')}</div>
        <p>An original concept model made for this website. It is not a client's property.</p>
      </footer>
    </aside>`;
}
/* The material panel: [kind, title, [[value, label, swatch]]]. A swatch is a texture name or a #colour. */
const MAT_UI = [
  ['clad', 'Cladding', [['teak', 'Teak HPL', 'teak'], ['cedar', 'Cedar', 'cedar'], ['walnut', 'Walnut', 'walnut'], ['charred', 'Charred timber', 'charred'], ['stone', 'Rustic grey', 'stone'], ['concrete', 'Board concrete', 'concrete'], ['brick', 'Red brick', 'brick']]],
  ['frame', 'Frames', [['marble', 'Statuario', 'marble'], ['plaster', 'White plaster', 'plaster'], ['travertine', 'Travertine', 'travertine'], ['concrete', 'Concrete', 'concrete'], ['whitebrick', 'White brick', 'brickWhite'], ['charcoal', 'Charcoal', '#3a3a3c']]],
  ['mullion', 'Window frames', [['black', 'Black', '#2b2c2e'], ['bronze', 'Bronze', '#6b4e33'], ['champagne', 'Champagne', '#b59e7c'], ['white', 'White', '#eeeeea'], ['silver', 'Silver', '#b8bcc0']]],
  ['glass', 'Glass', [['clear', 'Clear', '#bcd3da'], ['bronze', 'Bronze', '#8a6a4a'], ['grey', 'Grey', '#5f666b'], ['blue', 'Blue', '#5e8aa8'], ['frosted', 'Frosted', '#e9eef0']]],
  ['floor', 'Floors', [['mixed', 'Marble + oak', 'marbleFloor'], ['marble', 'Marble', 'marbleFloor'], ['oak', 'Oak', 'oak'], ['walnut', 'Walnut', 'walnutFloor'], ['ash', 'Ash', 'ashFloor'], ['terrazzo', 'Terrazzo', 'terrazzo'], ['slate', 'Slate', 'slate']]],
  ['timber', 'Pergola & deck', [['teak', 'Teak', 'teak'], ['cedar', 'Cedar', 'cedar'], ['walnut', 'Walnut', 'walnut'], ['charred', 'Charred', 'charred'], ['white', 'White', '#f2f0ec']]],
  ['boundary', 'Boundary wall', [['stone', 'Grey stone', 'stone'], ['concrete', 'Concrete', 'concrete'], ['brick', 'Brick', 'brick'], ['travertine', 'Travertine', 'travertine']]]
];
function swatch(kind, val, label, sw, pressed = false) {
  const attr = sw.startsWith('#') ? `style="background:${sw}"` : `data-tex="${sw}"`;
  return `<button type="button" class="x3d-sw" data-mat="${kind}" data-val="${val}" aria-pressed="${pressed}" title="${label}"><i ${attr}></i><span>${label}</span></button>`;
}
