/* The DS Concept House: an original design in the studio's language.
   Units are metres. Street on +Z, front façade at z = 6.
   Levels: plinth top 0.45, first floor 3.75, second floor 7.05, roof 10.35. */
import * as THREE from 'three';
import { Builder, wallX, wallZ, glazing, railX, railZ, louvresX, louvresZ, F } from './builder.js';

export const LV = { y0: 0.45, y1: 3.75, y2: 7.05, y3: 10.35 };
const T = 0.23;                       // exterior wall thickness
const XL = -6.5, XR = 6.5, ZB = -8, ZF = 6;

export function buildHouse(M, { interiors = true } = {}) {
  const B = new Builder();
  const root = new THREE.Group(); root.name = 'concept-house';
  const groups = {
    site: new THREE.Group(), L0: new THREE.Group(), L1: new THREE.Group(), L2: new THREE.Group(), roof: new THREE.Group()
  };
  groups.L0i = new THREE.Group(); groups.L1i = new THREE.Group(); groups.L2i = new THREE.Group();
  groups.L0.add(groups.L0i); groups.L1.add(groups.L1i); groups.L2.add(groups.L2i);
  Object.entries(groups).forEach(([k, g]) => { g.name = k; });
  root.add(groups.site, groups.L0, groups.L1, groups.L2, groups.roof);

  site(B, M);
  level0(B, M); level1(B, M); level2(B, M); roof(B, M);
  if (interiors) { interior0(B, M); interior1(B, M); interior2(B, M); }

  const meshes = B.build(groups);
  const lights = nightLights(groups);
  const proxies = makeProxies(groups);
  return { root, groups, meshes, lights, proxies, parts: B.count, boxes: B.boxes || [] };
}

/* ---------------- Site ---------------- */
function site(B, M) {
  B.setGroup('site');
  B.plane(220, 220, M.ground, 0, -0.03, 0);
  // street, footpath, kerb, markings
  B.plane(220, 9, M.asphalt, 0, -0.01, 21.5);
  for (let x = -100; x < 100; x += 6) B.box(3, 0.005, 0.16, M.line, x, 0.0, 21.5);
  B.box(220, 0.16, 0.25, M.kerb, 0, 0.08, 17.1);
  B.plane(220, 1.9, M.pavers, 0, 0.12, 16.1);
  B.box(220, 0.12, 2.0, M.kerb, 0, 0.06, 16.1);
  // plot, with a soft contact shadow under the house
  B.plane(24, 30, M.lawn, 0, 0.005, 0);
  B.decal(19, 20, M.aoRect, 0, 0.02, -1.0);
  // neighbours: quiet white massing for context
  for (const [x, z, w, d, h] of [[-30, 0, 20, 24, 8], [30, 0, 20, 24, 8.5], [-24, 34, 22, 18, 8], [0, 36, 18, 16, 12], [25, 35, 20, 18, 9], [0, -36, 30, 22, 10]]) {
    B.box(w, h * 0.8, d, M.neighbour, x, h * 0.4, z);
    for (let y = 1.4; y < h * 0.8 - 1; y += 3.3) B.box(w + 0.02, 0.9, d * 0.7, M.windowBand, x, y + 0.9, z);
  }
  // street trees and lamps
  for (let x = -60; x <= 60; x += 12) { tree(B, M, x + 3, 16.1, 0.9, (x / 12) % 3); lampPost(B, M, x - 3, 16.6); }

  // boundary wall: plaster base, stone panels, marble coping; gates on the street side
  const wallH = 1.7;
  const frontOps = [{ a: 6.8, b: 11.2, y0: 0, y1: 9 }, { a: 0.3, b: 1.7, y0: 0, y1: 9 }];
  wallX(B, -12, 12, 15, 0, wallH, 0.25, M.wallSite, frontOps);
  for (const [a, b] of [[-11.6, -7.6], [-6.8, -2.8], [-2.0, -0.2], [2.1, 6.4]]) B.box(b - a, 1.1, 0.04, M.stoneSite, (a + b) / 2, 0.85, 15.14);
  for (const [a, b] of [[-12, 0.3], [1.7, 6.8], [11.2, 12]]) B.box(b - a, 0.08, 0.36, M.frame, (a + b) / 2, wallH + 0.04, 15);
  for (const x of [0.15, 1.85, 6.65, 11.35]) B.box(0.35, 2.1, 0.4, M.wallSite, x, 1.05, 15);
  for (let x = 6.9; x < 11.1; x += 0.12) B.box(0.05, 1.75, 0.08, M.gate, x, 0.95, 15.05);      // sliding slatted gate
  B.box(4.4, 0.08, 0.1, M.gate, 9, 1.85, 15.05); B.box(4.4, 0.08, 0.1, M.gate, 9, 0.1, 15.05);
  for (let x = 0.4; x < 1.65; x += 0.1) B.box(0.04, 1.6, 0.06, M.gate, x, 0.85, 15.05);       // pedestrian gate
  B.box(0.3, 0.2, 0.05, M.brass, 1.0, 1.55, 15.2);                                               // house number plate
  wallZ(B, -15, 15, -12, 0, 1.9, 0.22, M.wallSite); wallZ(B, -15, 15, 12, 0, 1.9, 0.22, M.wallSite);
  wallX(B, -12, 12, -15, 0, 1.9, 0.22, M.wallSite);

  // driveway, path, steps
  B.span(6.8, 0, -3, 11.2, 0.04, 15, M.pavers);
  for (let z = 7.4; z < 14.8; z += 0.9) B.span(0.45, 0, z, 1.55, 0.05, z + 0.62, M.pavers);
  for (let i = 0; i < 3; i++) B.span(-0.6, 0, 6.05 + (2 - i) * 0.35, 3.0, 0.15 * (i + 1), 6.4 + (2 - i) * 0.35, M.frame);
  // planter bed along the front wall with shrubs and flowers
  B.span(-11.7, 0, 13.6, -0.2, 0.45, 14.75, M.stoneSite);
  for (let x = -11.2; x < -0.6; x += 0.7) { B.ball(0.38, M.shrub, x, 0.75, 14.2, 1, 1, 0.8, 1); B.ball(0.12, M.flower, x + 0.25, 0.95, 14.0, 0); }
  B.span(2.0, 0, 13.6, 6.5, 0.45, 14.75, M.stoneSite);
  for (let x = 2.4; x < 6.4; x += 0.7) B.ball(0.36, M.shrub, x, 0.74, 14.2, 1, 1, 0.8, 1);

  // pool and deck on the west side yard
  B.span(-11.7, 0, -6.4, -11.15, 0.16, 5.4, M.deck); B.span(-7.75, 0, -6.4, -6.5, 0.16, 5.4, M.deck);
  B.span(-11.15, 0, -6.4, -7.75, 0.16, -4.75, M.deck); B.span(-11.15, 0, 3.75, -7.75, 0.16, 5.4, M.deck);
  B.span(-11.15, -1.2, -4.75, -7.75, 0.0, 3.75, M.poolTile);              // basin
  B.box(3.25, 0.04, 8.35, M.water, -9.45, 0.09, -0.5);
  for (const z of [-3.6, -1.2, 1.2, 3.2]) B.box(0.18, 0.05, 0.1, M.glow, -7.86, 0.05, z);   // pool lights
  B.span(-11.15, 0.12, -4.75, -7.75, 0.2, -4.6, M.frame); B.span(-11.15, 0.12, 3.6, -7.75, 0.2, 3.75, M.frame);
  B.span(-11.15, 0.12, -4.75, -11.0, 0.2, 3.75, M.frame); B.span(-7.9, 0.12, -4.75, -7.75, 0.2, 3.75, M.frame);
  for (const z of [-5.6, -4.9]) { B.push(-9.0 + (z + 5.6) * 3, 0.16, -5.85, 0); B.box(0.7, 0.3, 1.9, M.timber, 0, 0.2, 0); B.box(0.62, 0.08, 1.85, M.fabricLight, 0, 0.38, 0.0); B.box(0.62, 0.5, 0.08, M.fabricLight, 0, 0.55, -0.8); B.pop(); }
  B.cyl(1.1, 1.1, 0.04, M.fabricLight, -11.0, 2.3, -5.6, 20); B.cyl(0.03, 0.03, 2.3, M.steel, -11.0, 1.15, -5.6, 8);

  // trees: rear garden, side yard, palms by the pool
  for (const [x, z, s, k] of [[-9, -12, 1.25, 0], [-4, -12.8, 1.0, 1], [1.5, -12.2, 1.15, 2], [7, -12.6, 1.3, 0], [10.4, -9, 0.9, 1], [-10.4, 9.5, 1.0, 2], [-6.6, 11.5, 0.8, 1], [10.5, 10.8, 0.75, 2]]) tree(B, M, x, z, s, k);
  for (const [x, z] of [[-11.4, 4.6], [-11.4, -6.0]]) palm(B, M, x, z);
  // car porch: steel posts and timber slats over the driveway
  for (const [x, z] of [[7.4, 0.4], [10.7, 0.4], [7.4, 6.2], [10.7, 6.2]]) B.box(0.12, 2.75, 0.12, M.black, x, 1.375, z);
  B.span(7.3, 2.75, 0.3, 10.8, 2.9, 0.5, M.black); B.span(7.3, 2.75, 6.1, 10.8, 2.9, 6.3, M.black);
  for (let x = 7.45; x < 10.75; x += 0.22) B.box(0.06, 0.16, 6.2, M.timber, x, 2.98, 3.3);
  // car on the driveway
  car(B, M, 9.0, 3.2);
  // garden bollards along the path and driveway
  for (let z = 8; z < 14.5; z += 2.2) { bollard(B, M, -0.05, z); bollard(B, M, 2.05, z); }
  for (let z = -2; z < 14; z += 4) bollard(B, M, 11.5, z);
  // people for scale
  person(B, M, 1.0, 11.2, M.person2); person(B, M, -8.4, 4.4, M.person);
}

function tree(B, M, x, z, s = 1, kind = 0) {
  B.cyl(0.12 * s, 0.2 * s, 3 * s, M.trunk, x, 1.5 * s, z, 8);
  B.decal(4.6 * s, 4.6 * s, M.aoRound, x + 0.4, 0.03, z + 0.3);
  const leaf = [M.leaf1, M.leaf2, M.leaf3][((Math.round(kind) % 3) + 3) % 3];
  const blobs = [[0, 3.6, 0, 1.5], [0.9, 3.3, 0.4, 1.0], [-0.8, 3.4, -0.3, 1.1], [0.2, 4.4, -0.5, 1.0], [-0.3, 3.0, 0.9, 0.9], [0.6, 4.0, 0.8, 0.8]];
  for (const [bx, by, bz, r] of blobs) B.ball(r * s, leaf, x + bx * s, by * s, z + bz * s, 2, 1, 0.85, 1);
}
function palm(B, M, x, z) {
  for (let i = 0; i < 7; i++) B.cyl(0.13 - i * 0.008, 0.15 - i * 0.008, 0.82, M.trunk, x + Math.sin(i * 0.4) * 0.08 * i, 0.41 + i * 0.8, z, 8);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    B.add(new THREE.ConeGeometry(0.28, 2.2, 4).rotateZ(Math.PI / 2 - 0.5).rotateY(-a), M.leaf2, x + Math.cos(a) * 0.9, 5.7, z + Math.sin(a) * 0.9);
  }
}
function lampPost(B, M, x, z) {
  B.cyl(0.07, 0.09, 6, M.bollard, x, 3, z, 10); B.box(1.4, 0.08, 0.1, M.bollard, x, 6, z + 0.6, Math.PI / 2);
  B.box(0.5, 0.12, 0.25, M.lamp, x, 5.92, z + 1.2);
}
function bollard(B, M, x, z) { B.cyl(0.07, 0.07, 0.7, M.bollard, x, 0.35, z, 12); B.cyl(0.072, 0.072, 0.1, M.lamp, x, 0.62, z, 12); }
/* Architectural scale figure: legs, tapered torso, arms, head */
function person(B, M, x, z, mat, ry = 0) {
  B.push(x, 0, z, ry);
  for (const s of [-1, 1]) {
    B.add(new THREE.CapsuleGeometry(0.065, 0.72, 3, 8), mat, s * 0.09, 0.43, 0);
    B.add(new THREE.CapsuleGeometry(0.05, 0.5, 3, 8), mat, s * 0.25, 1.15, 0, 0, 0, s * 0.08);
  }
  B.add(new THREE.CylinderGeometry(0.2, 0.15, 0.62, 12), mat, 0, 1.16, 0);
  B.ball(0.105, mat, 0, 1.6, 0, 2);
  B.pop();
}

/* Car: extruded side profile with a glass cabin, wheels and lights */
function extrudeProfile(pts, depth, bevel) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -depth / 2); g.rotateY(Math.PI / 2);
  return g;
}
function car(B, M, x, z) {
  B.decal(3.0, 5.6, M.aoRound, x, 0.05, z);
  B.push(x, 0, z, 0);
  // body (profile runs front +z to rear -z)
  B.add(extrudeProfile([[-2.3, 0.3], [2.3, 0.3], [2.35, 0.62], [2.2, 0.82], [1.1, 0.92], [-1.9, 0.95], [-2.3, 0.82]], 1.72, 0.06), M.carPaint, 0, 0, 0);
  B.add(extrudeProfile([[1.05, 0.9], [0.35, 1.36], [-1.25, 1.38], [-1.85, 0.93]], 1.52, 0.05), M.carGlass, 0, 0, 0);
  B.add(extrudeProfile([[0.3, 1.36], [-1.2, 1.38], [-1.22, 1.43], [0.25, 1.41]], 1.5, 0.03), M.carPaint, 0, 0, 0);
  for (const [wx, wz] of [[-0.86, 1.45], [0.86, 1.45], [-0.86, -1.5], [0.86, -1.5]]) {
    B.cyl(0.33, 0.33, 0.24, M.tyre, wx, 0.33, wz, 22, 0, Math.PI / 2);
    B.cyl(0.21, 0.21, 0.25, M.chrome, wx, 0.33, wz, 16, 0, Math.PI / 2);
  }
  B.box(0.5, 0.07, 0.05, M.lamp, -0.6, 0.72, 2.37); B.box(0.5, 0.07, 0.05, M.lamp, 0.6, 0.72, 2.37);
  B.box(1.5, 0.06, 0.05, M.flower, 0, 0.78, -2.37);
  B.box(0.6, 0.12, 0.03, M.black, 0, 0.45, 2.38);
  B.pop();
}

/* ---------------- Level 0: entrance, living, dining, kitchen, guest suite ---------------- */
function level0(B, M) {
  B.setGroup('L0');
  const y0 = 0, y1 = LV.y1 - 0.25;                 // walls from ground to the underside of slab 1
  B.span(XL - 0.1, 0, ZB - 0.1, XR + 0.1, LV.y0, ZF + 0.1, M.stone);            // stone plinth
  shadowGaps(B, M);
  B.span(XL, LV.y0 - 0.02, ZB, XR, LV.y0 + 0.006, ZF, M.floorMarble);
  // veranda in front of the living room (under the first-floor frame)
  B.span(XL, LV.y0 + 0.006, 5.2, -1.0, LV.y0 + 0.024, ZF, M.deck);

  // FRONT (z = 6): living glass set back at z = 5.2, stone wall, entrance, guest wall with strip window
  glazing(B, M, 'x', XL + 0.1, -1.0, LV.y0, y1 - 0.05, 5.2, { mullions: 3, transom: 2.5 });
  wallX(B, -1.0, 0.0, ZF, LV.y0, y1, T, M.stone);
  // entrance recess: pivot door in walnut with a long brass pull
  wallX(B, 0.0, 2.75, 5.2, LV.y0, y1, T, M.plaster, [{ a: 0.6, b: 2.05, y0: LV.y0, y1: 3.1 }]);
  B.box(1.4, 2.62, 0.07, M.door, 1.33, LV.y0 + 1.31, 5.24); B.box(0.04, 1.4, 0.06, M.brass, 1.85, 1.6, 5.32);
  glazing(B, M, 'x', 2.1, 2.7, LV.y0, 3.1, 5.2, { mullions: 0, sill: false });
  wallZ(B, 5.2, ZF, 0.0, LV.y0, y1, T, M.stone); wallZ(B, 5.2, ZF, 2.75, LV.y0, y1, T, M.plaster);
  // entrance canopy: marble frame projecting over the steps
  B.span(-0.35, 3.05, 5.2, 3.1, 3.38, 7.4, M.frame); B.span(-0.35, 2.9, 7.25, 3.1, 3.38, 7.45, M.frame);
  for (let x = 0.2; x < 2.8; x += 0.6) B.box(0.18, 0.03, 0.18, M.glow, x, 3.04, 6.6);
  wallX(B, 2.75, XR, ZF, LV.y0 - 0.45, y1, T, M.plaster, [{ a: 3.3, b: 6.0, y0: 1.7, y1: 2.55 }]);
  glazing(B, M, 'x', 3.3, 6.0, 1.7, 2.55, ZF, { mullions: 3 }); louvresX(B, M, 3.3, 6.0, 1.7, 2.55, ZF + 0.22);
  wallZ(B, 5.2, ZF, XL, LV.y0 - 0.45, y1, T, M.plaster);

  // LEFT (x = -6.5): living + dining open to the pool deck; kitchen window
  wallZ(B, ZB, 5.2, XL, LV.y0 - 0.45, y1, T, M.plaster, [{ a: 0.5, b: 4.9, y0: LV.y0, y1: y1 - 0.05 }, { a: -3.7, b: -0.3, y0: LV.y0, y1: y1 - 0.05 }, { a: -7.3, b: -4.9, y0: 1.5, y1: 2.5 }]);
  glazing(B, M, 'z', 0.5, 4.9, LV.y0, y1 - 0.05, XL, { mullions: 3, transom: 2.5 });
  glazing(B, M, 'z', -3.7, -0.3, LV.y0, y1 - 0.05, XL, { mullions: 2, transom: 2.5 });
  glazing(B, M, 'z', -7.3, -4.9, 1.5, 2.5, XL, { mullions: 2 });
  // stone fin between living and dining glass
  B.span(XL - 0.32, LV.y0 - 0.45, -0.3, XL - 0.02, 7.0, 0.5, M.stone);

  // REAR (z = -8): kitchen backsplash glass, guest window
  wallX(B, XL, XR, ZB, LV.y0 - 0.45, y1, T, M.plaster, [{ a: -6.0, b: -1.6, y0: 1.35, y1: 2.15 }, { a: 3.4, b: 6.0, y0: 1.2, y1: 2.9 }]);
  glazing(B, M, 'x', -6.0, -1.6, 1.35, 2.15, ZB, { mullions: 3 });
  glazing(B, M, 'x', 3.4, 6.0, 1.2, 2.9, ZB, { mullions: 2 });

  // RIGHT (x = 6.5): guest suite and powder windows with louvres
  wallZ(B, ZB, ZF, XR, LV.y0 - 0.45, y1, T, M.plaster, [{ a: -6.8, b: -3.0, y0: 1.2, y1: 2.9 }, { a: 0.6, b: 1.4, y0: 2.0, y1: 2.8 }]);
  glazing(B, M, 'z', -6.8, -3.0, 1.2, 2.9, XR, { mullions: 2 }); louvresZ(B, M, -6.8, -3.0, 1.2, 2.9, XR + 0.22);
  glazing(B, M, 'z', 0.6, 1.4, 2.0, 2.8, XR, { mullions: 0 });
  greenWall(B, M);

  // CORE: stone feature wall carrying the floating stair, lift with glass front
  wallZ(B, -4.4, 1.6, 2.75, LV.y0, 6.8, 0.25, M.stone);
  B.span(2.9, LV.y0, -4.4, 4.6, 6.8, -4.2, M.plaster); B.span(4.4, LV.y0, -4.4, 4.6, 6.8, 1.6, M.plaster);
  B.span(2.9, LV.y0, -2.8, 4.4, 3.1, -2.75, M.glass);                                                       // lift door
  B.span(2.95, LV.y0, -4.15, 4.35, 2.8, -2.85, M.steel);                                                    // lift car
  floatingStair(B, M);
}

/* Dark shadow-gap reveals under every slab edge, and wall-washer lights */
function shadowGaps(B, M) {
  for (const y of [LV.y1 - 0.29, LV.y2 - 0.29]) {
    B.span(XL - 0.02, y, ZF + 0.08, XR + 0.02, y + 0.04, ZF + 0.1, M.black);
    B.span(XL - 0.02, y, ZB - 0.1, XR + 0.02, y + 0.04, ZB - 0.08, M.black);
    B.span(XL - 0.1, y, ZB, XL - 0.08, y + 0.04, ZF, M.black);
    B.span(XR + 0.08, y, ZB, XR + 0.1, y + 0.04, ZF, M.black);
  }
  for (const x of [-0.85, -0.15]) B.box(0.12, 0.05, 0.12, M.glow, x, 0.5, ZF + 0.18);
}

/* Living green wall on the east façade */
function greenWall(B, M) {
  B.span(XR + 0.1, 0.9, 1.9, XR + 0.18, 3.25, 5.5, M.black);
  let k = 0;
  for (let y = 1.05; y < 3.2; y += 0.17) for (let z = 2.0; z < 5.45; z += 0.17) {
    k++; B.ball(0.12 + ((k * 37) % 7) / 100, [M.shrub, M.leaf2, M.leaf1, M.plant2][k % 4], XR + 0.27, y + ((k * 13) % 5) / 100, z, 0);
  }
}

function floatingStair(B, M) {
  const n = 18, rise = (LV.y1 - LV.y0) / n, run = 0.28;
  for (let i = 0; i < n; i++) {
    const z = 1.4 - i * run, y = LV.y0 + rise * (i + 1);
    B.box(1.15, 0.07, run + 0.02, M.panelWalnut, 2.06, y - 0.035, z - run / 2);
    B.box(1.15, 0.012, 0.012, M.glow, 2.06, y - 0.075, z - run + 0.02);
  }
  // glass balustrade along the open side, rising with the flight
  const g = new THREE.BoxGeometry(0.02, 1.0, n * run);
  g.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0, 0, -(rise / run) * 0, 0));
  for (let i = 0; i < n; i += 1) B.box(0.02, 1.0, run, M.rail, 1.48, LV.y0 + rise * (i + 1) + 0.5, 1.4 - i * run - run / 2);
}

/* ---------------- Level 1: master suite in the marble frame, teak-clad bedroom ---------------- */
function level1(B, M) {
  B.setGroup('L1');
  const yb = LV.y1 - 0.25, yf = LV.y1, yc = LV.y2 - 0.25;
  // slab with the lobby void cut out (x -1 .. 1.4, z -3.6 .. 1.6)
  B.span(XL - 0.05, yb, ZB - 0.05, -1.0, yf, ZF + 0.05, M.frame);
  B.span(1.4, yb, ZB - 0.05, XR + 0.05, yf, ZF + 0.05, M.frame);
  B.span(-1.0, yb, ZB - 0.05, 1.4, yf, -3.6, M.frame); B.span(-1.0, yb, 1.6, 1.4, yf, ZF + 0.05, M.frame);
  B.span(XL, yf, ZB, -1.0, yf + 0.01, ZF, M.floorOak); B.span(1.4, yf, ZB, XR, yf + 0.01, ZF, M.floorOak);
  B.span(-1.0, yf, -8, 1.4, yf + 0.01, -3.6, M.floorOak); B.span(-1.0, yf, 1.6, 1.4, yf + 0.01, ZF, M.floorOak);
  railX(B, M, -1.0, 1.4, 1.6, yf); railZ(B, M, -3.6, 1.6, -1.0, yf);

  // MARBLE FRAME BOX: cantilevered master suite, glazing, balcony
  const fx0 = -6.95, fx1 = 1.0, fz0 = 5.4, fz1 = 7.55;
  B.span(fx0, yb - 0.2, fz0, fx1, yf, fz1, M.frame);                         // bottom member
  B.span(fx0, yc, fz0, fx1, LV.y2 + 0.2, fz1, M.frame);                      // top member (terrace edge above)
  B.span(fx0, yb - 0.2, fz0, fx0 + 0.45, LV.y2 + 0.2, fz1, M.frame);          // left post
  B.span(fx1 - 0.45, yb - 0.2, fz0, fx1, LV.y2 + 0.2, fz1, M.frame);          // right post
  B.span(fx0 + 0.45, yf, ZF, fx1 - 0.45, yf + 0.03, fz1 - 0.05, M.deck);       // balcony floor
  glazing(B, M, 'x', XL + 0.1, fx1 - 0.45, yf, yc - 0.02, ZF, { mullions: 3, transom: 2.55 });
  railX(B, M, fx0 + 0.45, fx1 - 0.45, fz1 - 0.12, yf + 0.03);
  for (let x = fx0 + 0.9; x < fx1 - 0.6; x += 1.1) B.box(0.16, 0.02, 0.16, M.glow, x, yc - 0.01, 6.9);

  // TEAK VOLUME on the right front: two tall windows behind vertical louvres
  wallX(B, fx1 - 0.45, XR, ZF + 0.12, yf - 0.3, yc + 0.25, 0.3, M.clad, [{ a: 2.0, b: 3.0, y0: 4.1, y1: 6.4 }, { a: 4.6, b: 5.6, y0: 4.1, y1: 6.4 }]);
  for (const a of [2.0, 4.6]) { glazing(B, M, 'x', a, a + 1.0, 4.1, 6.4, ZF + 0.02, { mullions: 0 }); louvresX(B, M, a - 0.05, a + 1.05, 4.1, 6.4, ZF + 0.36, 0.12); }
  B.span(fx1 - 0.45, yc + 0.25, ZF - 0.05, XR + 0.15, yc + 0.4, ZF + 0.45, M.frame);    // white band over the teak

  // LEFT, REAR, RIGHT
  wallZ(B, ZB, fz0, XL, yf, yc, T, M.plaster, [{ a: 0.6, b: 5.0, y0: yf, y1: yc - 0.02 }, { a: -7.2, b: -3.0, y0: 4.4, y1: 6.3 }]);
  glazing(B, M, 'z', 0.6, 5.0, yf, yc - 0.02, XL, { mullions: 3, transom: 2.55 }); louvresZ(B, M, 0.6, 5.0, yf + 0.02, yc - 0.04, XL - 0.25, 0.16);
  glazing(B, M, 'z', -7.2, -3.0, 4.4, 6.3, XL, { mullions: 2 });
  wallX(B, XL, XR, ZB, yf, yc, T, M.plaster, [{ a: -6.0, b: -1.8, y0: yf, y1: yc - 0.02 }, { a: 4.0, b: 5.6, y0: 5.2, y1: 6.0 }]);
  glazing(B, M, 'x', -6.0, -1.8, yf, yc - 0.02, ZB, { mullions: 2, transom: 2.55 });
  glazing(B, M, 'x', 4.0, 5.6, 5.2, 6.0, ZB, { mullions: 1 });
  B.span(-6.3, yb, ZB - 1.4, -1.5, yf + 0.02, ZB, M.frame); railX(B, M, -6.3, -1.5, ZB - 1.35, yf + 0.02); railZ(B, M, ZB - 1.4, ZB, -6.3, yf + 0.02); railZ(B, M, ZB - 1.4, ZB, -1.5, yf + 0.02);
  wallZ(B, ZB, ZF + 0.12, XR, yf, yc, T, M.plaster, [{ a: 2.2, b: 5.4, y0: 4.1, y1: 6.4 }, { a: -7.0, b: -6.0, y0: 5.4, y1: 6.2 }]);
  glazing(B, M, 'z', 2.2, 5.4, 4.1, 6.4, XR, { mullions: 2 }); louvresZ(B, M, 2.2, 5.4, 4.1, 6.4, XR + 0.22, 0.12);
  glazing(B, M, 'z', -7.0, -6.0, 5.4, 6.2, XR, { mullions: 0 });
  // core continues
  B.span(2.9, yf, -4.4, 4.6, yc, -4.2, M.plaster); B.span(4.4, yf, -4.4, 4.6, yc, 1.6, M.plaster); B.span(2.9, yf, 1.4, 4.4, yc, 1.6, M.plaster);
  B.span(2.9, yf, -2.8, 4.4, yf + 2.6, -2.75, M.glass);
}

/* ---------------- Level 2: terrace garden + pergola, home theatre, gym, rear terrace ---------------- */
function level2(B, M) {
  B.setGroup('L2');
  const yb = LV.y2 - 0.25, yf = LV.y2, yc = LV.y3 - 0.25;
  B.span(XL - 0.05, yb, ZB - 0.05, XR + 0.05, yf, ZF + 0.05, M.frame);
  B.span(-2.0, yf, ZB, 0.2, yf + 0.01, 1.2, M.floorOak); B.span(XL, yf, ZB, -2.0, yf + 0.01, 1.2, M.floorOak);
  B.span(0.2, yf, -1.5, XR, yf + 0.01, 5.9, M.rugGrey);
  // terrace garden deck and planters
  B.span(XL, yf, 1.2, 0.2, yf + 0.04, 7.5, M.deck);
  railX(B, M, -6.5, 0.6, 7.42, LV.y2 + 0.2); railZ(B, M, 1.2, 7.42, XL + 0.05, yf + 0.04);
  for (let z = 1.8; z < 7.0; z += 1.3) { B.span(XL + 0.15, yf, z, XL + 0.75, yf + 0.55, z + 1.0, M.stone); B.ball(0.45, M.shrub, XL + 0.45, yf + 0.85, z + 0.5, 1, 1, 0.8, 1); }
  // pergola: timber slats on steel posts
  for (const [x, z] of [[-6.3, 7.2], [0.0, 7.2], [-6.3, 1.4], [0.0, 1.4]]) B.box(0.12, yc - yf + 0.2, 0.12, M.black, x, (yf + yc + 0.2) / 2, z);
  B.span(-6.45, yc + 0.05, 7.1, 0.15, yc + 0.25, 7.3, M.timber); B.span(-6.45, yc + 0.05, 1.3, 0.15, yc + 0.25, 1.5, M.timber);
  for (let x = -6.3; x <= 0.05; x += 0.28) B.box(0.07, 0.24, 6.1, M.timber, x, yc + 0.37, 4.3);
  // wall between terrace and the lounge/gym: full glass
  glazing(B, M, 'x', XL + 0.1, 0.2, yf, yc - 0.02, 1.2, { mullions: 4, transom: 2.55 });
  wallZ(B, 1.2, 5.9, 0.2, yf, yc, T, M.plaster);

  // HOME THEATRE: stone-clad volume with a slot window, under the projecting white cap
  wallX(B, 0.2, XR, 5.9, yf, yc, 0.3, M.stone, [{ a: 1.2, b: 5.4, y0: 8.55, y1: 8.95 }]);
  glazing(B, M, 'x', 1.2, 5.4, 8.55, 8.95, 5.9, { mullions: 3, sill: false });
  wallZ(B, -1.5, 5.9, XR, yf, yc, T, M.stone);
  wallX(B, 0.2, XR, -1.5, yf, yc, 0.15, M.wallInt, [{ a: 1.0, b: 1.9, y0: yf, y1: yf + 2.2 }]);

  // GYM + STUDY: west and rear glazing
  wallZ(B, ZB, 1.2, XL, yf, yc, T, M.plaster, [{ a: -7.4, b: 0.4, y0: 7.6, y1: 9.7 }]);
  glazing(B, M, 'z', -7.4, 0.4, 7.6, 9.7, XL, { mullions: 5 });
  wallX(B, XL, 0.2, ZB, yf, yc, T, M.plaster, [{ a: -6.0, b: -0.6, y0: 7.6, y1: 9.7 }]);
  glazing(B, M, 'x', -6.0, -0.6, 7.6, 9.7, ZB, { mullions: 3 });
  wallZ(B, ZB, -1.5, 0.2, yf, yc, T, M.plaster, [{ a: -6.6, b: -5.0, y0: yf, y1: yf + 2.4 }]);
  glazing(B, M, 'z', -6.6, -5.0, yf, yf + 2.4, 0.2, { mullions: 0, sill: false });

  // REAR TERRACE with a jacuzzi
  B.span(0.2, yf, ZB, XR, yf + 0.04, -1.5, M.deck);
  railX(B, M, 0.2, XR, ZB + 0.05, yf + 0.04); railZ(B, M, ZB, -1.5, XR - 0.05, yf + 0.04);
  B.span(3.2, yf, -6.8, 5.8, yf + 0.55, -4.2, M.frame); B.span(3.4, yf + 0.3, -6.6, 5.6, yf + 0.5, -4.4, M.water);
  B.push(1.8, yf + 0.04, -3.4, 0); F.outdoorSet(B, M); B.pop();

  // core
  B.span(-1.0, yf, -4.4, 4.6, yc + 0.0, -4.2, M.plaster); B.span(4.4, yf, -4.4, 4.6, yc, -1.5, M.plaster);
}

/* ---------------- Roof: cap, parapets, stair tower, tanks, solar ---------------- */
function roof(B, M) {
  B.setGroup('roof');
  const y = LV.y3;
  B.span(XL - 0.05, y - 0.25, ZB - 0.05, 0.2, y, 1.25, M.frame);                         // slab over gym/study
  // projecting white cap over the theatre and the rear terrace edge
  B.span(-0.1, y - 0.25, -1.6, XR + 0.35, y + 0.25, 6.65, M.frame);
  B.span(-0.1, y - 0.6, 6.45, XR + 0.35, y + 0.25, 6.65, M.frame);
  for (let x = 0.6; x < 6.4; x += 1.2) B.box(0.14, 0.02, 0.14, M.glow, x, y - 0.27, 6.2);
  // parapets
  wallX(B, XL, 0.2, ZB, y, y + 0.9, 0.2, M.plaster); wallZ(B, ZB, 1.25, XL, y, y + 0.9, 0.2, M.plaster);
  wallX(B, XL, 0.2, 1.25, y, y + 0.35, 0.2, M.plaster);
  // stair tower (mumty) with a door, tanks on top
  B.span(-1.0, y, -4.4, 4.6, y + 2.6, -4.2, M.plaster); B.span(4.4, y + 0.25, -4.4, 4.6, y + 2.6, -1.6, M.plaster);
  B.span(-1.0, y, -4.4, -0.8, y + 2.6, -1.6, M.plaster);
  B.span(-1.1, y + 2.6, -4.5, 4.7, y + 2.85, -1.5, M.frame);
  B.box(1.0, 2.1, 0.06, M.door, 0.4, y + 1.05, -1.62);
  for (const x of [1.4, 3.2]) { B.cyl(0.62, 0.62, 1.35, M.tank, x, y + 3.55, -3.0, 24); B.cyl(0.64, 0.64, 0.06, M.tank, x, y + 4.25, -3.0, 24); }
  // solar array over the gym, tilted to the south
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = -5.6 + c * 1.3, z = -6.8 + r * 2.4;
    B.add(new THREE.BoxGeometry(1.15, 0.05, 1.9).rotateX(-0.32), M.solar, x, y + 0.75, z);
    B.box(0.05, 0.6, 0.05, M.steel, x, y + 0.3, z - 0.6); B.box(0.05, 0.25, 0.05, M.steel, x, y + 0.12, z + 0.6);
  }
}

/* ---------------- Interiors ---------------- */
function interior0(B, M) {
  B.setGroup('L0i');
  const y = LV.y0, h = LV.y1 - 0.25;
  // partitions
  for (let x = -0.95; x < 0.0; x += 0.1) B.box(0.05, h - y, 0.12, M.panelWalnut, x + 0.05, (y + h) / 2, 3.2);  // jali between foyer and living
  wallX(B, 2.75, XR, -1.0, y, h, 0.12, M.wallInt, [{ a: 3.2, b: 4.1, y0: y, y1: y + 2.2 }]);
  wallZ(B, 1.6, 5.2, 2.75, y, h, 0.12, M.wallInt, [{ a: 2.0, b: 2.9, y0: y, y1: y + 2.2 }]);
  wallX(B, 2.75, XR, 2.6, y, h, 0.12, M.wallInt, [{ a: 3.0, b: 3.9, y0: y, y1: y + 2.2 }]);
  wallZ(B, -8, -4.4, 2.75, y, h, 0.12, M.wallInt);
  // living
  B.push(-3.4, y, 2.5, -Math.PI / 2); F.lSofa(B, M, 3.2, 2.3); B.pop();
  B.push(-6.33, y, 2.5, Math.PI / 2); F.tvWall(B, M, 3.4); B.pop();
  B.push(-4.7, y, 2.5, 0); F.rug(B, M, 2.8, 3.4); F.coffeeTable(B, M, 1.3, 0.7); B.pop();
  for (const z of [4.3]) { B.push(-4.7, y, z, Math.PI); F.armchair(B, M); B.pop(); }
  B.push(-1.6, y, 4.6, 0); F.floorLamp(B, M); B.pop();
  B.push(-6.0, y, 4.6, 0); F.plant(B, M, 1.3); B.pop();
  // dining
  B.push(-3.8, y, -2.0, 0); F.rug(B, M, 3.6, 2.6, M.rugGrey); F.diningSet(B, M, 8); B.pop();
  B.push(-1.4, y, -0.4, 0); F.plant(B, M, 1.1); B.pop();
  // kitchen
  B.push(-3.8, y, -7.88, 0); F.kitchenRun(B, M, 4.4); B.pop();
  B.push(-6.38, y, -6.3, Math.PI / 2); F.tallUnits(B, M, 2.4); B.pop();
  B.push(-3.7, y, -5.5, 0); F.island(B, M, 2.4); F.hood(B, M); B.pop();
  // foyer, lobby chandelier
  B.push(1.3, y, 4.95, Math.PI); F.console(B, M); B.pop();
  B.push(0.2, LV.y2 - 0.25, -1.0, 0); F.chandelier(B, M, 2.4); B.pop();
  B.push(-0.4, y, -3.2, 0); F.plant(B, M, 1.4); B.pop();
  // puja room and guest suite
  B.push(4.6, y, 5.65, Math.PI); F.puja(B, M); B.pop();
  B.push(4.6, y, -5.8, 0); F.bed(B, M, 1.6); B.pop();
  B.push(6.38, y, -1.8, -Math.PI / 2); F.wardrobe(B, M, 1.8); B.pop();
  B.push(5.6, y, 0.4, Math.PI); F.vanity(B, M, 1.2); B.pop();
  // ceiling cove lights
  for (const [x, z, w, d] of [[-3.75, 2.6, 5.0, 4.6], [-3.75, -2.0, 5.0, 3.8], [-3.75, -6.0, 5.0, 3.6]]) {
    B.box(w, 0.03, 0.05, M.glow, x, h - 0.05, z - d / 2); B.box(w, 0.03, 0.05, M.glow, x, h - 0.05, z + d / 2);
  }
}

function interior1(B, M) {
  B.setGroup('L1i');
  const y = LV.y1, h = LV.y2 - 0.25;
  wallX(B, XL, -1.0, -0.1, y, h, 0.12, M.wallInt, [{ a: -2.6, b: -1.7, y0: y, y1: y + 2.2 }]);
  wallX(B, XL, -1.0, -2.6, y, h, 0.12, M.wallInt, [{ a: -2.6, b: -1.7, y0: y, y1: y + 2.2 }]);
  wallZ(B, -2.6, 6.0, -1.0, y, h, 0.12, M.wallInt, [{ a: 0.3, b: 1.2, y0: y, y1: y + 2.2 }]);
  wallX(B, 1.4, XR, 1.4, y, h, 0.12, M.wallInt, [{ a: 1.6, b: 2.5, y0: y, y1: y + 2.2 }]);
  wallX(B, 2.75, XR, -4.4, y, h, 0.12, M.wallInt);
  // master suite
  B.push(-3.8, y, 3.0, Math.PI); F.bed(B, M, 1.9); B.pop();
  B.push(-3.8, y, 3.2, 0); F.rug(B, M, 3.2, 2.6); B.pop();
  B.push(-5.6, y, 5.3, Math.PI * 0.8); F.armchair(B, M, M.fabricLight); B.pop();
  B.push(-1.8, y, 5.3, 0); F.plant(B, M, 1.0); B.pop();
  // walk-in wardrobe
  B.push(-3.8, y, -2.5, 0); F.wardrobe(B, M, 4.6); B.pop();
  B.push(-3.8, y, -0.2, Math.PI); F.wardrobe(B, M, 4.6); B.pop();
  // bedroom 3 (rear) with study desk
  B.push(-4.2, y, -6.0, 0); F.bed(B, M, 1.6); B.pop();
  B.push(-1.8, y, -3.3, Math.PI); F.desk(B, M, 1.2); B.pop();
  // family lounge over the foyer
  B.push(0.2, y, 4.2, 0); F.sofa(B, M, 2.2, M.fabricDark); B.pop();
  B.push(0.2, y, 5.5, Math.PI); F.coffeeTable(B, M, 0.9, 0.5); B.pop();
  // bedroom 2 in the teak volume
  B.push(4.6, y, 3.8, -Math.PI / 2); F.bed(B, M, 1.6); B.pop();
  B.push(3.2, y, 1.55, 0); F.wardrobe(B, M, 2.0); B.pop();
  // bathroom
  B.push(4.6, y, -7.9, 0); F.vanity(B, M, 1.6); B.pop();
  B.push(6.0, y, -4.6, 0); F.shower(B, M); B.pop();
}

function interior2(B, M) {
  B.setGroup('L2i');
  const y = LV.y2;
  // theatre: screen wall, tiered recliners
  B.push(3.35, y, 5.6, Math.PI); B.box(5.2, 2.4, 0.1, M.screen, 0, 1.55, 0); B.box(5.4, 0.05, 0.12, M.glow, 0, 2.8, 0.02); B.pop();
  B.push(3.35, y, 1.6, 0); F.recliners(B, M, 2, 4); B.pop();
  for (const x of [0.6, 6.1]) B.box(0.2, 2.6, 6.8, M.panelWalnut, x, y + 1.3, 2.2);
  // gym
  B.push(-5.2, y, -5.4, 0); F.treadmill(B, M); B.pop();
  B.push(-3.6, y, -5.4, 0); F.treadmill(B, M); B.pop();
  B.push(-4.4, y, -1.4, 0); F.weights(B, M); F.rug(B, M, 3.2, 2.0, M.rugGrey); B.pop();
  // study + lounge
  B.push(-0.9, y, -7.75, 0); F.bookshelf(B, M, 2.0); B.pop();
  B.push(-0.9, y, -5.6, Math.PI); F.desk(B, M, 1.4); B.pop();
  B.push(-0.9, y, 0.2, Math.PI); F.armchair(B, M); B.pop();
}

/* ---------------- Night lights (point lights, off by day) ---------------- */
function nightLights(groups) {
  const L = [];
  const add = (g, x, y, z, color, dist, max) => {
    const p = new THREE.PointLight(color, 0, dist, 1.6); p.position.set(x, y, z); p.userData.max = max; p.userData.day = g === 'site' ? 0 : 0.3; groups[g].add(p); L.push(p);
  };
  add('L0', -3.8, 2.9, 2.6, 0xffd3a0, 9, 12);
  add('L0', 0.2, 4.0, -1.0, 0xffe0b0, 9, 10);
  add('L0', -3.8, 2.9, -5.5, 0xffe2b8, 8, 8);
  add('L1', -3.8, 6.3, 3.0, 0xffcf98, 8, 8);
  add('L2', -3.0, 9.8, 4.2, 0xffc890, 9, 9);
  add('L2', 3.3, 9.6, 2.2, 0xd8a8ff, 7, 5);
  add('site', -9.45, 0.4, -0.5, 0x66d6ff, 9, 8);
  add('site', 1.0, 3.0, 9.0, 0xffd28a, 10, 6);
  return L;
}

/* ---------------- Pickable rooms and elements ---------------- */
export const ROOMS = [
  // id, name, group, box [x0,y0,z0,x1,y1,z1], kind, text, link, linkLabel
  ['living', 'Living room', 'L0', [-6.4, 0.45, 0.2, -1.0, 3.4, 5.2], 'room', 'A double-aspect living room that opens to the pool deck on one side and a shaded veranda on the other, with a walnut media wall.', 'services.html#interiors', 'Interior design'],
  ['dining', 'Dining', 'L0', [-6.4, 0.45, -3.9, -1.0, 3.4, 0.2], 'room', 'Eight-seat dining between the living room and the kitchen, under three soft pendants, with glass to the garden.', 'services.html#interiors', 'Interior design'],
  ['kitchen', 'Modular kitchen', 'L0', [-6.4, 0.45, -7.9, -1.0, 3.4, -3.9], 'room', 'An island kitchen in warm laminates on boiling-water-resistant plywood, with tall appliance units and a backsplash window.', 'services.html#kitchens', 'Modular kitchens'],
  ['foyer', 'Entrance foyer', 'L0', [-1.0, 0.45, 1.6, 2.75, 3.4, 5.2], 'room', 'A walnut pivot door under a marble canopy opens into a calm foyer, screened from the living room by a timber jali.', 'services.html#architecture', 'Architecture & planning'],
  ['lobby', 'Double-height lobby', 'L0', [-1.0, 0.45, -3.6, 2.7, 6.8, 1.6], 'room', 'The heart of the house: a floating walnut stair cantilevered from a stone wall, a glass lift and a crystal chandelier over two floors.', 'services.html#architecture', 'Architecture & planning'],
  ['puja', 'Puja room', 'L0', [2.75, 0.45, 2.6, 6.4, 3.4, 5.9], 'room', 'A quiet prayer room in walnut and brass, placed in line with Vaastu principles.', 'speciality.html#vaastu', 'Vaastu-led planning'],
  ['guest', 'Guest suite', 'L0', [2.75, 0.45, -7.9, 6.4, 3.4, -1.0], 'room', 'A ground-floor suite with a wardrobe wall and its own vanity, ideal for parents.', 'services.html#interiors', 'Interior design'],
  ['master', 'Master suite', 'L1', [-6.4, 3.75, -0.1, -1.0, 6.75, 7.4], 'room', 'Set inside the cantilevered marble frame, with full-height glass and a balcony looking over the street.', 'services.html#interiors', 'Interior design'],
  ['walkin', 'Walk-in wardrobe', 'L1', [-6.4, 3.75, -2.6, -1.0, 6.75, -0.1], 'room', 'Floor-to-ceiling lacquered wardrobes on both sides of a dressing passage.', 'services.html#joinery', 'Wardrobes & joinery'],
  ['bed3', 'Bedroom with study', 'L1', [-6.4, 3.75, -9.3, -1.0, 6.75, -2.6], 'room', 'A rear bedroom with a study desk and its own balcony over the garden.', 'services.html#interiors', 'Interior design'],
  ['lounge', 'Family lounge & gallery', 'L1', [-1.0, 3.75, -3.6, 2.75, 6.75, 6.0], 'room', 'An informal family lounge above the foyer, with a glass-railed gallery over the lobby.', 'services.html#interiors', 'Interior design'],
  ['bed2', 'Bedroom in the teak volume', 'L1', [1.4, 3.75, 1.4, 6.4, 6.75, 6.2], 'room', 'Two tall windows behind vertical teak louvres give this bedroom privacy and dappled light.', 'services.html#architecture', 'Architecture & planning'],
  ['theatre', 'Home theatre', 'L2', [0.2, 7.05, -1.5, 6.4, 10.1, 5.9], 'room', 'A stone-clad volume with tiered recliners, acoustic walnut walls and a slot window under the projecting roof cap.', 'services.html#interiors', 'Interior design'],
  ['gym', 'Gym', 'L2', [-6.4, 7.05, -7.9, -2.0, 10.1, 1.2], 'room', 'A bright gym with a long ribbon window to the west and the rear garden.', 'services.html#interiors', 'Interior design'],
  ['study', 'Study & library', 'L2', [-2.0, 7.05, -7.9, 0.2, 10.1, 1.2], 'room', 'A library wall and desk on the quiet top floor.', 'services.html#joinery', 'Wardrobes & joinery'],
  ['terrace', 'Terrace garden', 'L2', [-6.4, 7.05, 1.2, 0.2, 10.4, 7.4], 'room', 'A planted terrace under a timber pergola, on top of the marble frame.', 'services.html#architecture', 'Architecture & planning'],
  ['jacuzzi', 'Rear terrace & jacuzzi', 'L2', [0.2, 7.05, -8.0, 6.4, 8.2, -1.5], 'room', 'An open deck with a jacuzzi and outdoor seating behind the theatre.', 'services.html#architecture', 'Architecture & planning'],
  ['pool', 'Pool & deck', 'site', [-11.6, 0, -6.4, -6.6, 0.4, 5.4], 'element', 'A lap pool on the west side yard with a timber deck, directly off the living and dining rooms.', 'services.html#management', 'Project management'],
  ['frame', 'Marble frame', 'L1', [-6.95, 3.3, 7.45, 1.0, 7.25, 7.6], 'element', 'The signature move: a white frame clad in Statuario marble, cantilevered over the veranda.', 'speciality.html#materials', 'Material library'],
  ['teak', 'Teak cladding & louvres', 'L1', [0.6, 3.45, 6.25, 6.5, 6.95, 6.6], 'element', 'Teak-look high-pressure laminate with vertical louvres: the warmth of timber without the upkeep.', 'speciality.html#materials', 'Material library'],
  ['stone', 'Stone-clad theatre', 'L2', [0.2, 7.05, 5.95, 6.5, 10.1, 6.15], 'element', 'Textured grey stone with fine grooves anchors the composition at the top.', 'speciality.html#materials', 'Material library'],
  ['pergola', 'Timber pergola', 'L2', [-6.45, 10.0, 1.3, 0.15, 10.55, 7.3], 'element', 'Slim timber slats cast striped shade over the terrace garden through the day.', 'speciality.html#materials', 'Material library'],
  ['gate', 'Boundary & gate', 'site', [-12, 0, 14.8, 12, 2.1, 15.25], 'element', 'Plaster and stone boundary wall with a slatted sliding gate and a marble coping.', 'services.html#architecture', 'Architecture & planning'],
  ['roof', 'Roof: solar & tanks', 'roof', [-6.4, 10.35, -7.9, 4.6, 13.2, 1.2], 'element', 'Solar panels tilted to the south, water tanks on the stair tower, and parapets that hide them from the street.', 'services.html#management', 'Project management']
];

function makeProxies(groups) {
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const list = [];
  for (const [id, name, g, b, kind, text, link, linkLabel] of ROOMS) {
    const [x0, y0, z0, x1, y1, z1] = b;
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const size = kind === 'room' ? `${(x1 - x0).toFixed(1)} m × ${(z1 - z0).toFixed(1)} m` : '';
    m.userData = { id, name, kind, text, link, linkLabel, size, group: g };
    groups[g].add(m); list.push(m);
  }
  return list;
}
