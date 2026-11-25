/* Procedural textures for the concept house, drawn on canvases.
   Every texture tiles seamlessly and is sized in real-world metres
   (see `tw`, the width in metres one tile covers). */
import * as THREE from 'three';

const cache = new Map();

function rand(seed) {                       // small deterministic PRNG
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function toTexture(c, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function noise(ctx, size, r, amount, alpha = 0.06) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/* Statuario marble: warm white with soft grey veins */
function marble(size = 1024, seed = 7, base = '#f3f1ec', vein = 'rgba(120,118,120,') {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const grd = ctx.createRadialGradient(size * .3, size * .4, 10, size * .5, size * .5, size * .8);
  grd.addColorStop(0, 'rgba(255,255,255,.5)'); grd.addColorStop(1, 'rgba(225,222,215,.35)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, size, size);
  for (let k = 0; k < 9; k++) {
    let x = r() * size, y = r() * size; const a = r() * Math.PI;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 18; s++) {
      x += Math.cos(a + (r() - .5) * 1.4) * size * .07; y += Math.sin(a + (r() - .5) * 1.4) * size * .07;
      ctx.lineTo(x, y);
    }
    const w = 0.6 + r() * 2.6;
    for (const [lw, op] of [[w * 6, .03], [w * 2.5, .07], [w, .2]]) {
      ctx.lineWidth = lw; ctx.strokeStyle = vein + op + ')'; ctx.stroke();
    }
  }
  noise(ctx, size, r, 10);
  return c;
}

/* Wood: planks with grain. Horizontal planks of `planks` rows per tile. */
function wood(size, seed, colors, planks = 8, gap = 'rgba(30,18,10,.55)', vertical = false) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const col = colors[Math.floor(r() * colors.length)];
    ctx.fillStyle = col; ctx.fillRect(0, p * ph, size, ph);
    for (let g = 0; g < 26; g++) {                      // grain streaks
      const y = p * ph + r() * ph; const amp = 1 + r() * 3; const freq = 0.004 + r() * 0.01;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 8) ctx.lineTo(x, y + Math.sin(x * freq + g) * amp);
      ctx.strokeStyle = `rgba(${r() < .5 ? '40,22,10' : '255,230,200'},${0.05 + r() * 0.09})`;
      ctx.lineWidth = 0.6 + r() * 1.6; ctx.stroke();
    }
    ctx.fillStyle = gap; ctx.fillRect(0, p * ph, size, Math.max(1, size / 512));   // plank seam
  }
  noise(ctx, size, r, 12);
  if (!vertical) return c;
  const [c2, ctx2] = canvas(size);
  ctx2.translate(size / 2, size / 2); ctx2.rotate(Math.PI / 2); ctx2.drawImage(c, -size / 2, -size / 2);
  return c2;
}

/* Textured grey stone with fine 12 x 6 mm grooves */
function stone(size = 1024, seed = 11) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#56524f'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const g = 60 + r() * 50; ctx.fillStyle = `rgba(${g},${g - 3},${g - 6},${0.08 + r() * 0.12})`;
    const s = 2 + r() * 14; ctx.fillRect(r() * size, r() * size, s, s * (0.4 + r()));
  }
  noise(ctx, size, r, 26);
  ctx.fillStyle = 'rgba(20,18,17,.55)';
  for (let y = 0; y < size; y += size / 4) ctx.fillRect(0, y, size, 3);           // horizontal grooves
  return c;
}

function plaster(size = 512, seed = 3, base = '#f4f2ee') {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  noise(ctx, size, r, 9);
  return c;
}

function pavers(size = 1024, seed = 5) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#7d7770'; ctx.fillRect(0, 0, size, size);
  const n = 8, s = size / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = 150 + r() * 40;
    ctx.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
    const off = (y % 2) * s / 2;
    ctx.fillRect(x * s + off + 2, y * s + 2, s - 4, s - 4);
    ctx.fillRect(x * s + off + 2 - size, y * s + 2, s - 4, s - 4);
  }
  noise(ctx, size, r, 18);
  return c;
}

function lawn(size = 1024, seed = 9) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#5f7f45'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 26000; i++) {
    const g = r();
    ctx.fillStyle = g < .5 ? `rgba(70,100,45,${.25 + r() * .3})` : `rgba(140,170,90,${.15 + r() * .25})`;
    ctx.fillRect(r() * size, r() * size, 1.4, 3 + r() * 5);
  }
  return c;
}

function asphalt(size = 1024, seed = 13) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#4a4a4c'; ctx.fillRect(0, 0, size, size);
  noise(ctx, size, r, 40);
  return c;
}

function water(size = 512, seed = 17) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#5fb8c9'); g.addColorStop(1, '#3d93ae');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  for (let i = 0; i < 70; i++) {
    ctx.lineWidth = .6 + r() * 1.6; ctx.beginPath();
    let x = r() * size, y = r() * size; ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (r() - .5) * 60; y += (r() - .5) * 60; ctx.quadraticCurveTo(x + 20, y - 10, x, y); }
    ctx.stroke();
  }
  return c;
}

function fabric(size = 256, seed = 21, base = '#d8d2c8') {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = .08; ctx.fillStyle = '#000';
  for (let i = 0; i < size; i += 3) { ctx.fillRect(i, 0, 1, size); ctx.fillRect(0, i, size, 1); }
  ctx.globalAlpha = 1; noise(ctx, size, r, 10);
  return c;
}

/* Rug with a quiet border pattern */
function rug(size = 512, seed = 23, base = '#b7a690', edge = '#7a2e5c') {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = edge; ctx.globalAlpha = .55; ctx.lineWidth = size * .03;
  ctx.strokeRect(size * .06, size * .06, size * .88, size * .88);
  ctx.lineWidth = 2; ctx.strokeRect(size * .12, size * .12, size * .76, size * .76);
  ctx.globalAlpha = 1; noise(ctx, size, r, 16);
  return c;
}

/* Solar panel cells */
function solar(size = 256) {
  const [c, ctx] = canvas(size);
  ctx.fillStyle = '#1d2a3c'; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(160,190,220,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(i * size / 6, 0); ctx.lineTo(i * size / 6, size); ctx.stroke(); }
  for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(0, i * size / 10); ctx.lineTo(size, i * size / 10); ctx.stroke(); }
  return c;
}

/* Soft contact-shadow decals (alpha maps) */
function aoRect(size = 512) {
  const [c, ctx] = canvas(size);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  ctx.filter = `blur(${size * 0.07}px)`; ctx.fillStyle = '#fff';
  ctx.fillRect(size * 0.16, size * 0.16, size * 0.68, size * 0.68);
  return c;
}
function aoRound(size = 256) {
  const [c, ctx] = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#888'); g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return c;
}


/* Board-formed concrete: grey, mottled, with formwork seams */
function concrete(size = 1024, seed = 71) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#9a9894'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) { const g = 135 + r() * 40; ctx.fillStyle = `rgba(${g},${g},${g - 3},${0.05 + r() * 0.08})`; const s = 8 + r() * 60; ctx.beginPath(); ctx.arc(r() * size, r() * size, s, 0, 7); ctx.fill(); }
  noise(ctx, size, r, 22);
  ctx.fillStyle = 'rgba(60,58,55,.35)';
  for (let y = 0; y < size; y += size / 6) ctx.fillRect(0, y, size, 2);
  for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(70,68,64,.5)'; ctx.beginPath(); ctx.arc(r() * size, r() * size, 1.5 + r() * 2, 0, 7); ctx.fill(); }
  return c;
}
/* Brick in running bond */
function brick(size = 1024, seed = 73, tones = ['#9b4a32', '#a85538', '#8e432d', '#b0613f', '#94503a']) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#cfc6b8'; ctx.fillRect(0, 0, size, size);
  const rows = 16, bh = size / rows, bw = size / 4;
  for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
    const off = (y % 2) * bw / 2; ctx.fillStyle = tones[Math.floor(r() * tones.length)];
    ctx.fillRect(x * bw + off + 3, y * bh + 3, bw - 6, bh - 6);
  }
  noise(ctx, size, r, 26);
  return c;
}
/* Travertine: warm beige with horizontal pores */
function travertine(size = 1024, seed = 77) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#d9cbb3'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) { const y = r() * size; ctx.fillStyle = `rgba(${150 + r() * 40},${130 + r() * 30},${100 + r() * 20},${0.08 + r() * 0.12})`; ctx.fillRect(0, y, size, 1 + r() * 5); }
  for (let i = 0; i < 900; i++) { ctx.fillStyle = 'rgba(120,100,75,.25)'; ctx.fillRect(r() * size, r() * size, 2 + r() * 9, 1 + r() * 2); }
  noise(ctx, size, r, 10);
  ctx.fillStyle = 'rgba(120,105,85,.3)'; for (let y = 0; y < size; y += size / 2) ctx.fillRect(0, y, size, 2);
  return c;
}
/* Terrazzo: pale ground with chips */
function terrazzo(size = 1024, seed = 79) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  ctx.fillStyle = '#e8e4dd'; ctx.fillRect(0, 0, size, size);
  const chips = ['#b9b2a8', '#8f8a84', '#c9a99a', '#7a2e5c', '#d6d0c6', '#a7a29b'];
  for (let i = 0; i < 2600; i++) { ctx.fillStyle = chips[Math.floor(r() * chips.length)]; ctx.globalAlpha = .55 + r() * .4; ctx.beginPath(); const x = r() * size, y = r() * size, s = 2 + r() * 9; ctx.moveTo(x, y); ctx.lineTo(x + s, y + r() * s); ctx.lineTo(x + r() * s, y + s); ctx.fill(); }
  ctx.globalAlpha = 1; noise(ctx, size, r, 8);
  return c;
}
/* Slate / grey stone tiles */
function slate(size = 1024, seed = 83) {
  const [c, ctx] = canvas(size); const r = rand(seed);
  const n = 4, s2 = size / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const g = 88 + r() * 26; ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`; ctx.fillRect(x * s2, y * s2, s2, s2); }
  noise(ctx, size, r, 20);
  ctx.fillStyle = 'rgba(30,30,32,.6)'; for (let i = 0; i <= n; i++) { ctx.fillRect(0, i * s2 - 1, size, 3); ctx.fillRect(i * s2 - 1, 0, 3, size); }
  return c;
}

const RECIPES = {
  aoRect: () => aoRect(),
  aoRound: () => aoRound(),
  marble: () => marble(1024, 7),
  marbleFloor: () => marble(1024, 31, '#ecebe7', 'rgba(140,135,130,'),
  teak: () => wood(1024, 41, ['#9a6440', '#8d5a37', '#a56d46', '#93603c'], 10),
  walnut: () => wood(1024, 43, ['#5a3a26', '#4f321f', '#63412b', '#553723'], 10),
  oak: () => wood(1024, 47, ['#c19a6b', '#b8905f', '#c9a375', '#b48a59'], 6),
  deck: () => wood(1024, 53, ['#8a6446', '#7e5a3e', '#93694a'], 9, 'rgba(25,15,8,.7)'),
  teakV: () => wood(1024, 57, ['#9a6440', '#8d5a37', '#a56d46'], 12, 'rgba(30,18,10,.6)', true),
  stone: () => stone(1024, 11),
  plaster: () => plaster(512, 3),
  plasterWarm: () => plaster(512, 4, '#ebe6de'),
  pavers: () => pavers(1024, 5),
  lawn: () => lawn(1024, 9),
  asphalt: () => asphalt(1024, 13),
  water: () => water(512, 17),
  fabricLight: () => fabric(256, 21, '#d9d3c9'),
  fabricDark: () => fabric(256, 22, '#4a4644'),
  fabricPlum: () => fabric(256, 25, '#6e3553'),
  rug: () => rug(512, 23),
  rugGrey: () => rug(512, 27, '#8f8a85', '#3a3534'),
  solar: () => solar(256),
  cedar: () => wood(1024, 61, ['#b5734a', '#a8653f', '#c07d52', '#ad6c46'], 10),
  cedarV: () => wood(1024, 62, ['#b5734a', '#a8653f', '#c07d52'], 12, 'rgba(30,18,10,.6)', true),
  charred: () => wood(1024, 63, ['#2b2725', '#34302d', '#262321', '#2f2b28'], 12, 'rgba(0,0,0,.65)'),
  charredV: () => wood(1024, 64, ['#2b2725', '#34302d', '#262321'], 12, 'rgba(0,0,0,.65)', true),
  walnutV: () => wood(1024, 65, ['#5a3a26', '#4f321f', '#63412b'], 12, 'rgba(20,12,6,.6)', true),
  walnutFloor: () => wood(1024, 67, ['#6a462f', '#5c3d28', '#73503a', '#634330'], 6),
  ashFloor: () => wood(1024, 69, ['#d9c7a8', '#d1bd9b', '#e0cfb2', '#cdb894'], 6),
  concrete: () => concrete(1024, 71),
  brick: () => brick(1024, 73),
  brickWhite: () => brick(1024, 75, ['#ebe7e1', '#e3ded7', '#f1ede7', '#ddd8d0']),
  travertine: () => travertine(1024, 77),
  terrazzo: () => terrazzo(1024, 79),
  slate: () => slate(1024, 83)
};

export function tex(name) {
  if (!cache.has(name)) cache.set(name, toTexture(RECIPES[name](), !name.startsWith('ao'), !name.startsWith('ao')));
  return cache.get(name);
}
