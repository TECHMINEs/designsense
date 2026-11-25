/* Materials, a batching geometry builder, and a furniture library.
   Everything static is merged per (level, material), so a scene made of
   thousands of parts renders in a few dozen draw calls. */
import * as THREE from 'three';
import { mergeGeometries } from '../../vendor/addons/BufferGeometryUtils.js';
import { tex } from './textures.js';

/* ---------------- Materials ---------------- */
export function makeMaterials() {
  const std = (o, tw = 1, building = true) => {
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.tw = tw; m.userData.building = building;
    return m;
  };
  const M = {
    // envelope
    frame: std({ map: tex('marble'), roughness: 0.28, color: 0xffffff }, 2.6),
    plaster: std({ map: tex('plaster'), roughness: 0.92, color: 0xebe6de }, 3),
    clad: std({ map: tex('teak'), roughness: 0.55, color: 0xffffff }, 2.2),
    stone: std({ map: tex('stone'), roughness: 0.86, color: 0xffffff }, 1.6),
    louvre: std({ map: tex('teakV'), roughness: 0.5, color: 0xffffff }, 1.2),
    timber: std({ map: tex('teak'), roughness: 0.6, color: 0xf0e6dc }, 1.4),
    mullion: std({ color: 0x2b2c2e, roughness: 0.38, metalness: 0.55 }),
    steel: std({ color: 0xc9ccd0, roughness: 0.22, metalness: 0.92 }),
    black: std({ color: 0x1d1e20, roughness: 0.5, metalness: 0.35 }),
    glass: std({ color: 0xa9c3cb, roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 1.6, emissive: 0xffc98a, emissiveIntensity: 0 }),
    rail: std({ color: 0xcfe0e4, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, envMapIntensity: 1.5 }),
    door: std({ map: tex('walnut'), roughness: 0.45, color: 0xffffff }, 1.2),
    brass: std({ color: 0xb08d57, roughness: 0.28, metalness: 0.9 }),
    tank: std({ color: 0x2d2f31, roughness: 0.7 }),
    solar: std({ map: tex('solar'), roughness: 0.2, metalness: 0.4, color: 0xffffff }, 1.1),
    // interior
    floorMarble: std({ map: tex('marbleFloor'), roughness: 0.16, color: 0xffffff }, 2.4),
    floorOak: std({ map: tex('oak'), roughness: 0.45, color: 0xffffff }, 1.8),
    wallInt: std({ map: tex('plasterWarm'), roughness: 0.95, color: 0xffffff }, 3),
    panelWalnut: std({ map: tex('walnut'), roughness: 0.5, color: 0xffffff }, 1.6),
    lacquer: std({ color: 0xf1eee8, roughness: 0.35 }),
    kitchen: std({ color: 0xd9ccb8, roughness: 0.42 }),
    kitchenDark: std({ color: 0x5a4a3f, roughness: 0.4 }),
    counter: std({ map: tex('marble'), roughness: 0.18, color: 0xf2f0ea }, 1.5),
    fabricLight: std({ map: tex('fabricLight'), roughness: 0.95, color: 0xffffff }, 0.6),
    fabricDark: std({ map: tex('fabricDark'), roughness: 0.95, color: 0xffffff }, 0.6),
    fabricPlum: std({ map: tex('fabricPlum'), roughness: 0.95, color: 0xffffff }, 0.6),
    linen: std({ color: 0xf4f1ea, roughness: 0.92 }),
    rug: std({ map: tex('rug'), roughness: 1, color: 0xffffff }, 2.4),
    rugGrey: std({ map: tex('rugGrey'), roughness: 1, color: 0xffffff }, 2.4),
    woodDark: std({ map: tex('walnut'), roughness: 0.48, color: 0xffffff }, 1),
    woodLight: std({ map: tex('oak'), roughness: 0.5, color: 0xffffff }, 1),
    plant: std({ color: 0x4d7a3a, roughness: 0.85, flatShading: true }),
    plant2: std({ color: 0x6a9148, roughness: 0.85, flatShading: true }),
    pot: std({ color: 0x8c8378, roughness: 0.8 }),
    screen: std({ color: 0x0d0f12, roughness: 0.15, metalness: 0.4 }),
    seat: std({ color: 0x3b2430, roughness: 0.8 }),
    glow: std({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 0.25, roughness: 0.6 }),
    crystal: std({ color: 0xffffff, roughness: 0.05, metalness: 0.2, emissive: 0xffe6b8, emissiveIntensity: 0.15, transparent: true, opacity: 0.85 }),
    // site
    lawn: std({ map: tex('lawn'), roughness: 1, color: 0xffffff }, 4, false),
    pavers: std({ map: tex('pavers'), roughness: 0.9, color: 0xffffff }, 3.2, false),
    asphalt: std({ map: tex('asphalt'), roughness: 0.95, color: 0xffffff }, 6, false),
    kerb: std({ color: 0xc4bfb7, roughness: 0.9 }, 1, false),
    deck: std({ map: tex('deck'), roughness: 0.7, color: 0xffffff }, 2.4, false),
    wallSite: std({ map: tex('plaster'), roughness: 0.92, color: 0xffffff }, 3, false),
    stoneSite: std({ map: tex('stone'), roughness: 0.86, color: 0xffffff }, 1.6, false),
    gate: std({ color: 0x1c1d1f, roughness: 0.45, metalness: 0.4 }, 1, false),
    water: std({ map: tex('water'), roughness: 0.05, metalness: 0.1, color: 0xffffff, transparent: true, opacity: 0.88, emissive: 0x3fb6d6, emissiveIntensity: 0 }, 3, false),
    poolTile: std({ color: 0xd9e9ec, roughness: 0.4 }, 1, false),
    trunk: std({ color: 0x5d4a3a, roughness: 0.95 }, 1, false),
    leaf1: std({ color: 0x4a6e34, roughness: 0.92 }, 1, false),
    leaf2: std({ color: 0x5f8540, roughness: 0.92 }, 1, false),
    leaf3: std({ color: 0x3b5a2e, roughness: 0.92 }, 1, false),
    shrub: std({ color: 0x55793c, roughness: 0.92 }, 1, false),
    flower: std({ color: 0xc46a8e, roughness: 0.8, flatShading: true }, 1, false),
    carPaint: std({ color: 0xe8e8ea, roughness: 0.22, metalness: 0.65 }, 1, false),
    carGlass: std({ color: 0x1b2229, roughness: 0.05, metalness: 0.6 }, 1, false),
    tyre: std({ color: 0x151515, roughness: 0.9 }, 1, false),
    chrome: std({ color: 0xd8dadd, roughness: 0.15, metalness: 1 }, 1, false),
    bollard: std({ color: 0x2a2a2c, roughness: 0.5, metalness: 0.5 }, 1, false),
    lamp: std({ color: 0xfff6e2, emissive: 0xffd28a, emissiveIntensity: 0.0, roughness: 0.5 }, 1, false),
    person: std({ color: 0xe9e5df, roughness: 0.9 }, 1, false),
    person2: std({ color: 0xd6cfc7, roughness: 0.9 }, 1, false),
    ground: std({ color: 0x8e9a76, roughness: 1 }, 1, false),
    neighbour: std({ color: 0xd8d3cb, roughness: 0.95 }, 1, false),
    line: std({ color: 0xf2f0ea, roughness: 0.9 }, 1, false),
    windowBand: std({ color: 0x9aa4aa, roughness: 0.3, metalness: 0.3 }, 1, false)
  };
  const ao = (name) => { const m = new THREE.MeshBasicMaterial({ color: 0x14130f, transparent: true, opacity: 0.42, alphaMap: tex(name), depthWrite: false }); m.userData = { tw: 1, building: false }; return m; };
  M.aoRect = ao('aoRect'); M.aoRound = ao('aoRound');
  for (const [k, m] of Object.entries(M)) m.name = k;
  return M;
}

/* ---------------- Builder ---------------- */
const tmpM = new THREE.Matrix4();

export class Builder {
  constructor() {
    this.buckets = new Map();       // `${group}|${material.name}` -> { group, mat, geos: [] }
    this.stack = [new THREE.Matrix4()];
    this.group = 'site';
    this.count = 0;
  }
  setGroup(g) { this.group = g; return this; }
  top() { return this.stack[this.stack.length - 1]; }
  push(x = 0, y = 0, z = 0, ry = 0) {
    const m = new THREE.Matrix4().makeRotationY(ry); m.setPosition(x, y, z);
    this.stack.push(this.top().clone().multiply(m));
    return this;
  }
  pop() { this.stack.pop(); return this; }

  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    if (geo.index) geo = geo.toNonIndexed();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    tmpM.makeRotationFromEuler(new THREE.Euler(rx, ry, rz)); tmpM.setPosition(x, y, z);
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(this.top(), tmpM));
    const key = `${this.group}|${mat.name}`;
    if (!this.buckets.has(key)) this.buckets.set(key, { group: this.group, mat, geos: [] });
    this.buckets.get(key).geos.push(geo);
    this.count++;
    return this;
  }

  /* Box centred at (x, y, z). UVs are scaled to world metres so textures keep their size. */
  box(w, h, d, mat, x, y, z, ry = 0) {
    // Anti z-fighting: grow every box by a hair (0.6-4 mm). Small detail parts grow more than big
    // ones, plus a small per-part step, so two faces never sit on exactly the same plane.
    const inf = 0.0006 + 0.0024 * Math.max(0, 1 - Math.cbrt(w * h * d) / 1.6) + ((this.count * 7) % 11) * 0.00022;
    w += 2 * inf; h += 2 * inf; d += 2 * inf;
    const g = new THREE.BoxGeometry(w, h, d);
    const tw = mat.userData.tw || 1;
    const uv = g.attributes.uv;
    const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * sizes[f][0] / tw, uv.getY(i) * sizes[f][1] / tw);
    }
    // record axis-aligned boxes so overlapping faces can be audited (see viewer api.audit)
    const e = this.top().elements;
    if (!ry && Math.abs(e[0] - 1) < 1e-6 && Math.abs(e[5] - 1) < 1e-6 && Math.abs(e[10] - 1) < 1e-6) {
      const cx = x + e[12], cy = y + e[13], cz = z + e[14];
      (this.boxes || (this.boxes = [])).push([cx - w / 2, cy - h / 2, cz - d / 2, cx + w / 2, cy + h / 2, cz + d / 2, mat.name, this.group]);
    }
    return this.add(g, mat, x, y, z, ry);
  }
  /* Box from min corner (x0, y0, z0) to max corner */
  span(x0, y0, z0, x1, y1, z1, mat) {
    return this.box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }
  cyl(rt, rb, h, mat, x, y, z, seg = 18, rx = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rt, rb, h, seg, 1), mat, x, y, z, 0, rx, rz);
  }
  ball(r, mat, x, y, z, detail = 1, sx = 1, sy = 1, sz = 1) {
    const g = new THREE.IcosahedronGeometry(r, detail); g.scale(sx, sy, sz);
    return this.add(g, mat, x, y, z);
  }
  /* Flat decal with 0..1 UVs (contact shadows) */
  decal(w, d, mat, x, y, z) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return this.add(g, mat, x, y, z); }
  plane(w, d, mat, x, y, z) {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const tw = mat.userData.tw || 1; const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tw, uv.getY(i) * d / tw);
    return this.add(g, mat, x, y, z);
  }

  /* Merge buckets into meshes, one per (group, material). */
  build(groups) {
    const meshes = [];
    for (const { group, mat, geos } of this.buckets.values()) {
      const target = groups[group]; if (!target) continue;
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat);
      const transparent = mat.transparent;
      mesh.castShadow = !transparent && !['lawn', 'asphalt', 'ground', 'water', 'line', 'pavers', 'rug', 'rugGrey'].includes(mat.name);
      mesh.receiveShadow = !mat.name.startsWith('ao');
      if (transparent) mesh.renderOrder = 2;
      target.add(mesh); meshes.push(mesh);
    }
    this.buckets.clear();
    return meshes;
  }
}

/* ---------------- Architectural parts ---------------- */

/* A wall along X (fixed z) from x0 to x1, with rectangular openings
   [{ a, b, y0, y1 }] in absolute x / y. */
export function wallX(B, x0, x1, z, y0, y1, t, mat, openings = []) {
  const ops = openings.filter((o) => o.b > x0 && o.a < x1).sort((p, q) => p.a - q.a);
  let x = x0;
  for (const o of ops) {
    if (o.a > x) B.span(x, y0, z - t / 2, o.a, y1, z + t / 2, mat);
    if (o.y0 > y0) B.span(o.a, y0, z - t / 2, o.b, o.y0, z + t / 2, mat);
    if (o.y1 < y1) B.span(o.a, o.y1, z - t / 2, o.b, y1, z + t / 2, mat);
    x = Math.max(x, o.b);
  }
  if (x < x1) B.span(x, y0, z - t / 2, x1, y1, z + t / 2, mat);
}
export function wallZ(B, z0, z1, x, y0, y1, t, mat, openings = []) {
  const ops = openings.filter((o) => o.b > z0 && o.a < z1).sort((p, q) => p.a - q.a);
  let z = z0;
  for (const o of ops) {
    if (o.a > z) B.span(x - t / 2, y0, z, x + t / 2, y1, o.a, mat);
    if (o.y0 > y0) B.span(x - t / 2, y0, o.a, x + t / 2, o.y0, o.b, mat);
    if (o.y1 < y1) B.span(x - t / 2, o.y1, o.a, x + t / 2, y1, o.b, mat);
    z = Math.max(z, o.b);
  }
  if (z < z1) B.span(x - t / 2, y0, z, x + t / 2, y1, z1, mat);
}

/* Glazing panel in an opening: frame, glass, vertical mullions, sill.
   axis 'x' = wall along X at depth `d`; axis 'z' = wall along Z at x = `d`. */
export function glazing(B, M, axis, a, b, y0, y1, d, { mullions = 2, transom = 0, sill = true, frameMat = M.mullion } = {}) {
  const f = 0.05, depth = 0.08;
  const len = b - a, mid = (a + b) / 2, h = y1 - y0, cy = (y0 + y1) / 2;
  const put = (w, hh, dd, x, y, zz) => axis === 'x' ? B.box(w, hh, dd, frameMat, x, y, zz) : B.box(dd, hh, w, frameMat, zz, y, x);
  put(len, f, depth, mid, y0 + f / 2, d); put(len, f, depth, mid, y1 - f / 2, d);
  put(f, h, depth, a + f / 2, cy, d); put(f, h, depth, b - f / 2, cy, d);
  for (let i = 1; i <= mullions; i++) put(f * 0.8, h, depth, a + (len * i) / (mullions + 1), cy, d);
  if (transom) put(len, f * 0.8, depth, mid, y0 + transom, d);
  if (axis === 'x') B.box(len - f, h - f, 0.02, M.glass, mid, cy, d);
  else B.box(0.02, h - f, len - f, M.glass, d, cy, mid);
  if (sill && y0 > 0.3) {
    const s = 0.09, dp = 0.14, off = 0.07 * Math.sign(d || 1);
    if (axis === 'x') {
      B.box(len + 2 * s, s, dp, M.frame, mid, y1 + s / 2, d + off);
      B.box(s, h + s, dp, M.frame, a - s / 2, cy + s / 2, d + off); B.box(s, h + s, dp, M.frame, b + s / 2, cy + s / 2, d + off);
    } else {
      B.box(dp, s, len + 2 * s, M.frame, d + off, y1 + s / 2, mid);
      B.box(dp, h + s, s, M.frame, d + off, cy + s / 2, a - s / 2); B.box(dp, h + s, s, M.frame, d + off, cy + s / 2, b + s / 2);
    }
    if (axis === 'x') B.box(len + 0.1, 0.05, 0.22, M.frame, mid, y0 - 0.025, d + 0.06 * Math.sign(d || 1));
    else B.box(0.22, 0.05, len + 0.1, M.frame, d + 0.06 * Math.sign(d || 1), y0 - 0.025, mid);
  }
}

/* Glass balustrade with a stainless top rail and base shoe */
export function railX(B, M, x0, x1, z, y, h = 1.05) {
  const L = x1 - x0, cx = (x0 + x1) / 2;
  B.box(L, h, 0.02, M.rail, cx, y + h / 2, z);
  B.cyl(0.025, 0.025, L, M.steel, cx, y + h + 0.02, z, 10, 0, Math.PI / 2);
  B.box(L, 0.08, 0.07, M.mullion, cx, y + 0.04, z);
}
export function railZ(B, M, z0, z1, x, y, h = 1.05) {
  const L = z1 - z0, cz = (z0 + z1) / 2;
  B.box(0.02, h, L, M.rail, x, y + h / 2, cz);
  B.cyl(0.025, 0.025, L, M.steel, x, y + h + 0.02, cz, 10, Math.PI / 2, 0);
  B.box(0.07, 0.08, L, M.mullion, x, y + 0.04, cz);
}

/* Vertical louvres in front of an opening (wall along X) */
export function louvresX(B, M, a, b, y0, y1, z, step = 0.14) {
  for (let x = a + step / 2; x < b; x += step) B.box(0.04, y1 - y0, 0.16, M.louvre, x, (y0 + y1) / 2, z);
  B.box(b - a, 0.06, 0.2, M.mullion, (a + b) / 2, y1, z); B.box(b - a, 0.06, 0.2, M.mullion, (a + b) / 2, y0, z);
}
export function louvresZ(B, M, a, b, y0, y1, x, step = 0.14) {
  for (let z = a + step / 2; z < b; z += step) B.box(0.16, y1 - y0, 0.04, M.louvre, x, (y0 + y1) / 2, z);
  B.box(0.2, 0.06, b - a, M.mullion, x, y1, (a + b) / 2); B.box(0.2, 0.06, b - a, M.mullion, x, y0, (a + b) / 2);
}

/* ---------------- Furniture (local coordinates, floor at y = 0) ---------------- */
export const F = {
  sofa(B, M, w = 2.4, mat = M.fabricLight) {
    B.box(w, 0.42, 0.95, mat, 0, 0.21, 0);
    B.box(w, 0.5, 0.2, mat, 0, 0.62, -0.38);
    B.box(0.18, 0.62, 0.95, mat, -w / 2 + 0.09, 0.31, 0); B.box(0.18, 0.62, 0.95, mat, w / 2 - 0.09, 0.31, 0);
    const n = Math.max(2, Math.round(w / 0.8));
    for (let i = 0; i < n; i++) B.box((w - 0.4) / n - 0.03, 0.14, 0.7, mat, -w / 2 + 0.2 + ((w - 0.4) / n) * (i + 0.5), 0.49, 0.05);
    for (let i = 0; i < n; i++) B.box(0.42, 0.38, 0.12, M.fabricPlum, -w / 2 + 0.2 + ((w - 0.4) / n) * (i + 0.5), 0.72, -0.24);
  },
  lSofa(B, M, w = 3, d = 2.2) {
    F.sofa(B, M, w);
    B.push(w / 2 - 0.48, 0, 0.95 / 2 + (d - 0.95) / 2, 0);
    B.box(0.95, 0.42, d - 0.95, M.fabricLight, 0, 0.21, 0);
    B.box(0.2, 0.62, d - 0.95, M.fabricLight, 0.38, 0.31, 0);
    B.pop();
  },
  armchair(B, M, mat = M.fabricPlum) {
    B.box(0.8, 0.4, 0.8, mat, 0, 0.2, 0); B.box(0.8, 0.45, 0.16, mat, 0, 0.62, -0.32);
    B.box(0.12, 0.55, 0.8, mat, -0.34, 0.28, 0); B.box(0.12, 0.55, 0.8, mat, 0.34, 0.28, 0);
  },
  coffeeTable(B, M, w = 1.2, d = 0.65) {
    B.box(w, 0.06, d, M.counter, 0, 0.38, 0); B.box(w - 0.2, 0.32, d - 0.2, M.woodDark, 0, 0.18, 0);
  },
  rug(B, M, w, d, mat = M.rug) { B.box(w, 0.014, d, mat, 0, 0.01, 0); },
  tvWall(B, M, w = 3) {
    B.box(w, 2.6, 0.06, M.panelWalnut, 0, 1.3, 0);
    B.box(w * 0.7, 0.42, 0.45, M.lacquer, 0, 0.21, 0.25);
    B.box(1.6, 0.92, 0.05, M.screen, 0, 1.35, 0.06);
    B.box(w, 0.04, 0.06, M.glow, 0, 2.62, 0.05);
  },
  floorLamp(B, M) {
    B.cyl(0.14, 0.16, 0.03, M.brass, 0, 0.015, 0); B.cyl(0.012, 0.012, 1.5, M.brass, 0, 0.77, 0);
    B.cyl(0.16, 0.22, 0.28, M.glow, 0, 1.6, 0);
  },
  plant(B, M, s = 1) {
    B.cyl(0.18 * s, 0.14 * s, 0.4 * s, M.pot, 0, 0.2 * s, 0);
    B.ball(0.32 * s, M.plant, 0, 0.62 * s, 0, 1, 1, 1.3, 1);
    B.ball(0.22 * s, M.plant2, 0.1 * s, 0.85 * s, 0.05 * s, 0);
  },
  diningSet(B, M, seats = 8) {
    const L = seats > 6 ? 2.6 : 2;
    B.box(L, 0.06, 1.0, M.woodDark, 0, 0.75, 0);
    B.box(0.12, 0.72, 0.7, M.woodDark, -L / 2 + 0.35, 0.36, 0); B.box(0.12, 0.72, 0.7, M.woodDark, L / 2 - 0.35, 0.36, 0);
    const per = seats / 2;
    for (let i = 0; i < per; i++) {
      const x = -L / 2 + (L / per) * (i + 0.5);
      for (const s of [-1, 1]) {
        B.push(x, 0, s * 0.68, s > 0 ? Math.PI : 0);
        B.box(0.46, 0.06, 0.46, M.fabricLight, 0, 0.46, 0); B.box(0.46, 0.5, 0.06, M.fabricLight, 0, 0.74, 0.21);
        for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) B.box(0.03, 0.46, 0.03, M.woodDark, lx, 0.23, lz);
        B.pop();
      }
    }
    for (let i = -1; i <= 1; i++) { B.cyl(0.005, 0.005, 0.8, M.black, i * 0.7, 2.2, 0, 6); B.cyl(0.12, 0.18, 0.22, M.glow, i * 0.7, 1.7, 0, 16); }
  },
  kitchenRun(B, M, L) {                               // base + counter + wall units, along local X, back at z = 0
    B.box(L, 0.86, 0.6, M.kitchen, 0, 0.43, 0.3); B.box(L, 0.04, 0.64, M.counter, 0, 0.88, 0.32);
    for (let x = -L / 2 + 0.6; x < L / 2; x += 0.6) B.box(0.008, 0.8, 0.005, M.kitchenDark, x, 0.43, 0.605);
    B.box(L, 0.7, 0.35, M.kitchen, 0, 1.95, 0.18);
    B.box(L, 0.55, 0.02, M.counter, 0, 1.2, 0.01);
    B.box(L, 0.03, 0.3, M.glow, 0, 1.58, 0.2);
  },
  tallUnits(B, M, L) { B.box(L, 2.3, 0.62, M.kitchenDark, 0, 1.15, 0.31); for (let x = -L / 2 + 0.6; x < L / 2; x += 0.6) B.box(0.01, 2.2, 0.01, M.black, x, 1.15, 0.625); },
  island(B, M, L = 2.4) {
    B.box(L, 0.9, 1.0, M.kitchenDark, 0, 0.45, 0); B.box(L + 0.3, 0.05, 1.1, M.counter, 0.15, 0.925, 0);
    for (let i = 0; i < 3; i++) {
      const x = -L / 2 + 0.5 + i * 0.7;
      B.cyl(0.18, 0.18, 0.06, M.fabricDark, x, 0.72, 0.85, 16); B.cyl(0.02, 0.02, 0.7, M.steel, x, 0.36, 0.85, 8);
      B.cyl(0.005, 0.005, 1.0, M.black, x, 2.35, 0, 6); B.ball(0.14, M.glow, x, 1.8, 0, 1);
    }
  },
  hood(B, M) { B.box(0.9, 0.08, 0.55, M.steel, 0, 1.75, 0); B.box(0.28, 1.1, 0.28, M.steel, 0, 2.35, 0); },
  bed(B, M, w = 1.9) {
    B.box(w + 0.1, 0.3, 2.15, M.woodDark, 0, 0.15, 0.05);
    B.box(w, 0.25, 2.0, M.linen, 0, 0.42, 0.08);
    B.box(w - 0.1, 0.05, 1.2, M.fabricPlum, 0, 0.56, 0.45);
    for (const s of [-1, 1]) B.box(0.62, 0.14, 0.38, M.linen, s * w / 4, 0.62, -0.72);
    B.box(w + 0.9, 1.25, 0.1, M.panelWalnut, 0, 0.9, -1.0);
    for (const s of [-1, 1]) {
      B.box(0.5, 0.48, 0.42, M.woodDark, s * (w / 2 + 0.38), 0.24, -0.75);
      B.cyl(0.11, 0.14, 0.24, M.glow, s * (w / 2 + 0.38), 0.72, -0.75, 16);
    }
  },
  wardrobe(B, M, L, h = 2.5) {
    B.box(L, h, 0.6, M.lacquer, 0, h / 2, 0.3);
    for (let x = -L / 2 + 0.5; x < L / 2; x += 0.5) B.box(0.008, h - 0.1, 0.01, M.black, x, h / 2, 0.605);
    for (let x = -L / 2 + 0.25; x < L / 2; x += 0.5) B.box(0.02, 0.9, 0.02, M.black, x + 0.2, 1.1, 0.62);
  },
  desk(B, M, w = 1.4) {
    B.box(w, 0.04, 0.65, M.woodLight, 0, 0.74, 0); B.box(0.04, 0.72, 0.6, M.black, -w / 2 + 0.05, 0.36, 0); B.box(0.04, 0.72, 0.6, M.black, w / 2 - 0.05, 0.36, 0);
    B.box(0.5, 0.08, 0.5, M.fabricDark, 0, 0.48, 0.55); B.box(0.5, 0.55, 0.06, M.fabricDark, 0, 0.8, 0.78);
    B.box(0.55, 0.35, 0.03, M.screen, 0, 1.0, -0.2);
  },
  bookshelf(B, M, L = 2.4, h = 2.4) {
    B.box(L, h, 0.36, M.woodDark, 0, h / 2, 0.18);
    for (let y = 0.4; y < h; y += 0.45) {
      B.box(L - 0.06, 0.03, 0.34, M.lacquer, 0, y, 0.19);
      for (let x = -L / 2 + 0.12; x < L / 2 - 0.1; x += 0.06 + ((x * 7.3) % 0.05)) B.box(0.035, 0.24 + ((x * 13) % 0.08), 0.22, [M.fabricPlum, M.fabricDark, M.kitchen, M.fabricLight][Math.abs(Math.round(x * 31)) % 4], x, y + 0.14, 0.2);
    }
  },
  vanity(B, M, L = 1.6) {
    B.box(L, 0.5, 0.55, M.woodDark, 0, 0.6, 0.27); B.box(L, 0.04, 0.58, M.counter, 0, 0.87, 0.29);
    B.box(L, 0.9, 0.03, M.glass, 0, 1.6, 0.02); B.box(L, 0.03, 0.06, M.glow, 0, 2.08, 0.04);
  },
  recliners(B, M, rows = 2, perRow = 4) {
    for (let r = 0; r < rows; r++) {
      const y = r * 0.35;
      B.box(perRow * 0.95 + 0.4, y + 0.02, 1.2, M.rugGrey, 0, (y + 0.02) / 2, r * 1.25);
      for (let i = 0; i < perRow; i++) {
        const x = -((perRow - 1) * 0.95) / 2 + i * 0.95;
        B.box(0.8, 0.45, 0.85, M.seat, x, y + 0.24, r * 1.25); B.box(0.8, 0.65, 0.18, M.seat, x, y + 0.75, r * 1.25 + 0.36);
        B.box(0.14, 0.62, 0.85, M.seat, x - 0.42, y + 0.31, r * 1.25);
      }
    }
  },
  treadmill(B, M) {
    B.box(0.8, 0.18, 1.9, M.black, 0, 0.09, 0); B.box(0.6, 0.02, 1.5, M.fabricDark, 0, 0.19, 0.1);
    B.box(0.06, 1.1, 0.06, M.steel, -0.35, 0.65, -0.8); B.box(0.06, 1.1, 0.06, M.steel, 0.35, 0.65, -0.8); B.box(0.76, 0.3, 0.12, M.black, 0, 1.25, -0.8);
  },
  weights(B, M) {
    B.box(1.6, 0.08, 0.5, M.black, 0, 0.6, 0); B.box(1.6, 0.08, 0.5, M.black, 0, 0.2, 0);
    for (let i = 0; i < 6; i++) B.cyl(0.08, 0.08, 0.3, M.steel, -0.65 + i * 0.26, 0.72, 0, 12, 0, Math.PI / 2);
  },
  outdoorSet(B, M) {
    B.box(2.2, 0.38, 0.9, M.timber, 0, 0.19, 0); B.box(2.2, 0.12, 0.8, M.fabricLight, 0, 0.44, 0.04); B.box(2.2, 0.42, 0.14, M.fabricLight, 0, 0.66, -0.36);
    B.box(0.9, 0.36, 0.9, M.timber, 0, 0.18, 1.3);
    for (const s of [-1, 1]) { B.push(s * 1.8, 0, 1.3, -s * Math.PI / 2); F.armchair(B, M, M.fabricLight); B.pop(); }
  },
  puja(B, M) {
    B.box(1.4, 0.8, 0.5, M.panelWalnut, 0, 0.4, 0.25); B.box(1.4, 1.5, 0.08, M.panelWalnut, 0, 1.55, 0.04);
    B.box(1.0, 0.9, 0.3, M.brass, 0, 1.3, 0.2); B.box(1.5, 0.05, 0.6, M.glow, 0, 2.33, 0.3);
  },
  /* Cascade chandelier: a brass canopy with rings of glass strands of varying length */
  chandelier(B, M, drop = 2.5) {
    B.cyl(0.55, 0.55, 0.04, M.brass, 0, -0.02, 0, 32);
    for (let t = 0; t < 3; t++) {
      const r = 0.16 + t * 0.17, n = 10 + t * 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.3;
        const len = drop * (0.55 + 0.25 * Math.sin(a * 2 + t) + (2 - t) * 0.12);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        B.cyl(0.0035, 0.0035, len, M.steel, x, -len / 2, z, 4);
        B.ball(0.028, M.crystal, x, -len, z, 1);
        B.ball(0.018, M.crystal, x, -len * 0.7, z, 1);
      }
    }
  },
  shower(B, M) { B.box(1.0, 2.1, 0.02, M.glass, 0, 1.05, 0); B.box(0.02, 2.1, 1.0, M.glass, 0.5, 1.05, -0.5); B.box(1.0, 0.04, 1.0, M.counter, 0, 0.02, -0.5); },
  console(B, M) { B.box(1.4, 0.05, 0.4, M.counter, 0, 0.82, 0); B.box(0.05, 0.8, 0.35, M.brass, -0.6, 0.4, 0); B.box(0.05, 0.8, 0.35, M.brass, 0.6, 0.4, 0); B.cyl(0.4, 0.4, 0.02, M.glass, 0, 1.6, -0.15, 32, Math.PI / 2, 0); }
};
