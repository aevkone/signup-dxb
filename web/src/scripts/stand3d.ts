/**
 * Фотореалистичный стенд 48 м² на WebGL (three.js).
 *
 * Тот же сценарий, что у запасной 2D-версии: подлёт камеры сверху → логистика →
 * пол, стены, подсобка, ферма → печать, LED-экран, баннер → мебель → персонал
 * и посетители → облёт → демонтаж → отлёт. Петля 20 с, кадр — функция времени.
 *
 * Реализм — материалами и светом: ворс ковра, матовые панели, хромированная ферма
 * из труб, лак стойки, мягкие тени, отражения окружения, прожекторы с конусами,
 * светящиеся LED и короб. На экране и печати — реальные фото работ.
 * Люди — объёмные фигуры в пропорциях человека, с нарисованными лицами.
 *
 * Мир в метрах, ось z вверх: площадка 8 × 6, задняя стена вдоль y = 0,
 * боковая — вдоль x = 0, проход посетителей — со стороны +y.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BEAT, DROP, FAST, SNAP, SOFT, clamp, ease, lerp, track, win, wrap } from './spring';
import type { Spring, Key } from './spring';

/** Отдать управление браузеру между кусками работы. */
const breathe = () => new Promise<void>((done) => setTimeout(done, 0));

const LB = 40;
const LOOPT = LB * BEAT;
const tr = (v0: number, keys: Key[], s: Spring) => track(v0, keys, s, LOOPT);
const wn = (on: number, off: number, s: Spring = FAST) => win(on, off, s, LOOPT);
export const STILL3D = 22 * BEAT;

const FONT = '"Montserrat Variable", Montserrat, system-ui, sans-serif';
const SCRIPT = 'Caveat, cursive';
const F = 0.15; // высота подиума

/* ---------- Текстуры, нарисованные кодом ---------- */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  draw(c);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { tex: t, ctx: c, redraw: () => { draw(c); t.needsUpdate = true; } };
}
/** Шум для ворса ковра и шероховатости. */
function noiseTex(size: number, base: [number, number, number], amp: number, repeat: number) {
  const { tex } = canvasTex(size, size, (c) => {
    const img = c.createImageData(size, size);
    let seed = 7;
    for (let i = 0; i < size * size; i++) {
      seed = (seed * 16807) % 2147483647;
      const n = (seed / 2147483647 - 0.5) * amp;
      img.data[i * 4] = clamp(base[0] + n, 0, 255);
      img.data[i * 4 + 1] = clamp(base[1] + n, 0, 255);
      img.data[i * 4 + 2] = clamp(base[2] + n, 0, 255);
      img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
function woodTex() {
  const { tex } = canvasTex(256, 256, (c) => {
    c.fillStyle = '#8a7a52';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#9a8a5f' : '#7d6d47';
      c.fillRect(0, i * 43, 256, 41);
      c.fillStyle = 'rgba(40,30,15,0.5)';
      c.fillRect(0, i * 43 + 41, 256, 2);
      for (let k = 0; k < 12; k++) {
        c.strokeStyle = 'rgba(60,45,20,0.18)';
        c.beginPath();
        const y = i * 43 + 4 + k * 3.2;
        c.moveTo(0, y);
        c.bezierCurveTo(80, y + 2, 170, y - 2, 256, y + 1);
        c.stroke();
      }
    }
    c.fillStyle = 'rgba(30,22,10,0.55)';
    for (const [x, y] of [[16, 20], [240, 20], [16, 236], [240, 236]]) {
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fill();
    }
  });
  return tex;
}
/** Мягкий градиент для конусов света и свечения. */
function glowTex(radial: boolean) {
  const { tex } = canvasTex(128, 128, (c) => {
    const g = radial ? c.createRadialGradient(64, 64, 0, 64, 64, 64) : c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(radial ? 0.35 : 0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  }, false);
  return tex;
}
function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
}
function cover(c: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / im.width, h / im.height);
  const iw = w / s;
  const ih = h / s;
  c.drawImage(im, (im.width - iw) / 2, (im.height - ih) / 2, iw, ih, x, y, w, h);
}

/* ---------- Геометрия ---------- */
/** Коробка с основанием в начале координат: растёт вверх через scale.z. */
function boxGeo(w: number, d: number, h: number) {
  const g = new THREE.BoxGeometry(w, d, h);
  g.translate(w / 2, d / 2, h / 2);
  return g;
}
type FaceDir = '+x' | '-x' | '+y' | '-y' | '+z';
/** Плоскость-наклейка на грань: начало — нижний левый угол, если смотреть на грань снаружи. */
function decalGeo(w: number, h: number, dir: FaceDir) {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(w / 2, h / 2, 0);
  if (dir === '+z') return g;
  g.rotateX(Math.PI / 2); // смотрит в −y, верх — +z
  if (dir === '+y') g.rotateZ(Math.PI);
  if (dir === '+x') g.rotateZ(Math.PI / 2);
  if (dir === '-x') g.rotateZ(-Math.PI / 2);
  return g;
}
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = shadow;
  o.receiveShadow = true;
  return o;
};

/** Ферма из труб: 4 пояса и диагональная решётка, вдоль оси x, длина len. */
function trussGeo(len: number, size = 0.29) {
  const r = 0.022;
  const parts: THREE.BufferGeometry[] = [];
  const tube = (a: THREE.Vector3, b: THREE.Vector3, rad: number) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const g = new THREE.CylinderGeometry(rad, rad, d.length(), 8, 1, true);
    g.translate(0, d.length() / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    g.applyQuaternion(q);
    g.translate(a.x, a.y, a.z);
    parts.push(g);
  };
  const h = size / 2;
  const corners = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  for (const [y, z] of corners) tube(new THREE.Vector3(0, y, z), new THREE.Vector3(len, y, z), r);
  const step = size;
  for (let x = 0; x < len - 0.01; x += step) {
    const x1 = Math.min(len, x + step);
    for (let k = 0; k < 4; k++) {
      const a = corners[k];
      const b = corners[(k + 1) % 4];
      tube(new THREE.Vector3(x, a[0], a[1]), new THREE.Vector3(x1, b[0], b[1]), r * 0.55);
    }
  }
  return mergeGeos(parts);
}
function mergeGeos(geos: THREE.BufferGeometry[]) {
  // Простое слияние без индексов: позиции и нормали подряд.
  let n = 0;
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of flat) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/* ---------- Люди ---------- */
type Outfit = 'staff' | 'suit' | 'kandura' | 'abaya' | 'dress' | 'casual';
type Look = { skin: string; hair: string; outfit: Outfit; top: string; bottom: string; long?: boolean; height?: number; beard?: boolean; eyes?: string; female?: boolean };

/**
 * Лицо — текстура на передней части головы: тени глазниц, белки, радужка с бликом,
 * брови, переносица и крылья носа, губы, румянец, у бороды — щетина.
 * Кешируется по сочетанию тона кожи, волос и бороды.
 */
const faceCache = new Map<string, THREE.CanvasTexture>();
function shadeHex(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(v * f, 0, 255)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function faceTexture(look: Look) {
  const key = `${look.skin}|${look.hair}|${look.beard}|${look.eyes}|${look.female}`;
  const hit = faceCache.get(key);
  if (hit) return hit;
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d')!;
  // Кожа: ровный тон, лёгкий объём к центру
  c.fillStyle = look.skin;
  c.fillRect(0, 0, S, S);
  const vol = c.createRadialGradient(128, 120, 10, 128, 128, 150);
  vol.addColorStop(0, 'rgba(255,240,225,0.18)');
  vol.addColorStop(1, 'rgba(0,0,0,0.12)');
  c.fillStyle = vol;
  c.fillRect(0, 0, S, S);
  const eyeY = 112;
  for (const ex of [94, 162]) {
    // Глазница
    const sock = c.createRadialGradient(ex, eyeY, 4, ex, eyeY, 30);
    sock.addColorStop(0, shadeHex(look.skin, 0.72));
    sock.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sock;
    c.beginPath();
    c.ellipse(ex, eyeY, 30, 20, 0, 0, Math.PI * 2);
    c.fill();
    // Белок, радужка, зрачок, блик
    c.fillStyle = '#f1ece6';
    c.beginPath();
    c.ellipse(ex, eyeY, 15, 7.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = look.eyes ?? '#4a2f1d';
    c.beginPath();
    c.arc(ex, eyeY, 6.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0d0907';
    c.beginPath();
    c.arc(ex, eyeY, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(ex + 2.4, eyeY - 2.4, 1.6, 0, Math.PI * 2);
    c.fill();
    // Верхнее веко и ресницы
    c.strokeStyle = shadeHex(look.skin, 0.45);
    c.lineWidth = look.female ? 3.4 : 2.4;
    c.beginPath();
    c.ellipse(ex, eyeY + 1, 15.5, 8.5, 0, Math.PI * 1.08, Math.PI * 1.92);
    c.stroke();
    // Бровь
    c.strokeStyle = look.hair;
    c.lineWidth = look.female ? 4 : 6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(ex - 18, eyeY - 20);
    c.quadraticCurveTo(ex, eyeY - 28, ex + 18, eyeY - 21);
    c.stroke();
  }
  // Нос: тень по боку и крылья
  c.strokeStyle = shadeHex(look.skin, 0.78);
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(118, 118);
  c.quadraticCurveTo(114, 150, 116, 162);
  c.stroke();
  c.fillStyle = shadeHex(look.skin, 0.6);
  for (const nx of [118, 138]) {
    c.beginPath();
    c.ellipse(nx, 166, 5, 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Борода и щетина
  if (look.beard) {
    c.fillStyle = look.hair;
    c.globalAlpha = 0.92;
    c.beginPath();
    c.moveTo(56, 150);
    c.quadraticCurveTo(70, 240, 128, 246);
    c.quadraticCurveTo(186, 240, 200, 150);
    c.quadraticCurveTo(186, 210, 128, 214);
    c.quadraticCurveTo(70, 210, 56, 150);
    c.fill();
    c.beginPath();
    c.moveTo(98, 182);
    c.quadraticCurveTo(128, 172, 158, 182);
    c.quadraticCurveTo(128, 192, 98, 182);
    c.fill();
    c.globalAlpha = 1;
  }
  // Губы
  const lip = look.female ? '#a8505a' : shadeHex(look.skin, 0.68);
  c.fillStyle = lip;
  c.beginPath();
  c.moveTo(108, 192);
  c.quadraticCurveTo(128, 184, 148, 192);
  c.quadraticCurveTo(128, 206, 108, 192);
  c.fill();
  c.strokeStyle = shadeHex(look.skin, 0.45);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(108, 192);
  c.quadraticCurveTo(128, 196, 148, 192);
  c.stroke();
  // Румянец
  c.fillStyle = 'rgba(200,90,90,0.12)';
  for (const bx of [80, 176]) {
    c.beginPath();
    c.arc(bx, 162, 20, 0, Math.PI * 2);
    c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  faceCache.set(key, t);
  return t;
}
/** Передняя часть головы под текстуру лица: смотрит в +y, верх — +z. */
const faceGeo = (() => {
  const g = new THREE.SphereGeometry(0.1015, 18, 13, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.9, 1.8);
  g.rotateX(Math.PI / 2);
  g.rotateZ(Math.PI);
  return g;
})();
type Person = { root: THREE.Group; legs: THREE.Group[]; arms: THREE.Group[] };
const SKIN = ['#e7bfa0', '#c99572', '#9c6a4b', '#6e4530', '#dcae8a'];
const HAIR = ['#2b1d16', '#4a3020', '#121212', '#7a5233', '#b8935e'];
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const cloth = (color: string, rough = 0.85) => {
  const k = color + rough;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 }));
  return matCache.get(k)!;
};

/**
 * Пропорции взрослого — канон 8 голов (img2threejs, forge/stage2_spec/humanoid_proportions.py,
 * anatomy.source = canon-table): доли роста H. Рост базовой фигуры 1,75 м, дальше её
 * масштабирует look.height.
 */
const PH = 1.75;
const HEAD_H = PH / 8; // высота головы 0,219
const HIP_Z = 0.5 * PH; // линия бедра 0,875 — ноги ровно 4 головы
const KNEE_Z = 0.25 * PH; // линия колена 0,4375 (голень с ногой — тоже 0,25 H)
const UPPER_ARM = 0.187 * PH; // плечо 0,327
const FOREARM = 0.187 * PH; // предплечье 0,327
const SHOULDER_W = 0.25 * PH; // ширина плеч 0,4375 — 2 головы
const HIP_W = 0.1875 * PH; // ширина бёдер 0,328
const WAIST_W = 0.125 * PH; // талия 0,219 (без одежды)
// Корпус канона не даёт этих отметок — это условности рисунка фигуры, не измерения:
const SHOULDER_Z = 1.42; // плечевой сустав ≈ 1⅓ головы от макушки
const HAND_L = 0.15; // кисть ≈ лицо: кончики пальцев у середины бедра
const FOOT_L = 0.25; // стопа ≈ голова, в обуви
const ANKLE_Z = 0.07;
const HEAD_S = HEAD_H / 0.232; // голова 0,2 × 1,16 → ровно 1/8 роста
const HEAD_Z = PH - HEAD_H / 2; // центр головы = линия глаз
const DEPTH = 0.64; // глубина корпуса к ширине
const CLOTH = 0.03; // припуск одежды на талии

/** Профиль вращения (радиус, высота) → тело с овальным сечением: ось z, глубина по y. */
function latheGeo(pts: [number, number][], depth = DEPTH, seg = 14) {
  const g = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  g.scale(1, depth, 1);
  return g;
}
/** Сужающийся сегмент конечности от шарнира вниз: r0 у шарнира, r1 у конца. */
function limbGeo(r0: number, r1: number, len: number, over = 0) {
  const g = new THREE.CylinderGeometry(r0, r1, len + over, 10, 1, true);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, over - (len + over) / 2);
  return g;
}
/** Плечевой пояс одежды: от талии к шее, с трапецией. sw — полуширина плеч по одежде. */
const yoke = (sw: number): [number, number][] => [
  [sw, 1.38],
  [sw - 0.004, 1.43],
  [sw - 0.02, 1.46],
  [0.12, 1.485],
  [0.06, 1.505],
  [0.045, 1.51],
];
/** Перед корпуса на высоте груди: y поверхности для x при полуширине r. */
const front = (x: number, r: number, depth = DEPTH) => depth * r * Math.sqrt(Math.max(0, 1 - (x / r) ** 2));

function makePerson(look: Look): Person {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const fem = !!look.female;
  const k = fem ? 0.88 : 1; // женские конечности тоньше (условность, не канон)
  const skin = cloth(look.skin, 0.6);
  const robe = look.outfit === 'kandura' || look.outfit === 'abaya';
  const jacket = look.outfit === 'staff' || look.outfit === 'suit';
  const topMat = cloth(look.top, robe ? (look.outfit === 'kandura' ? 0.75 : 0.55) : jacket ? 0.6 : 0.82);
  const botMat = cloth(look.bottom, 0.8);
  const shoeMat = cloth(look.outfit === 'kandura' ? '#4a3426' : look.outfit === 'dress' ? '#5a4034' : '#141414', 0.45);
  const legs: THREE.Group[] = [];
  const arms: THREE.Group[] = [];

  // Полуширины по канону: плечевой сустав внутри дельты, бёдра, талия с припуском
  const delt = 0.056 * k;
  const shX = (SHOULDER_W / 2) * (fem ? 0.9 : 1) - delt;
  const sw = shX + delt * 0.25;
  const hipR = (HIP_W / 2) * (fem ? 1.05 : 1) + 0.004;
  const waistR = (WAIST_W / 2) * (fem ? 0.92 : 1) + CLOTH;
  const chestR = fem ? sw - 0.012 : sw - 0.004;

  /* Ноги: бедро → колено → голень → обувь. Левая — зеркало правой (scale.x = −1). */
  const standing = look.outfit === 'staff';
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09 * (fem ? 1.02 : 1), 0, HIP_Z);
    hip.scale.x = side;
    const thigh = new THREE.Group();
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.z = -(HIP_Z - KNEE_Z);
    thigh.add(knee);
    if (!robe) {
      const bare = look.outfit === 'dress';
      const legMat = bare ? skin : botMat;
      thigh.add(mesh(limbGeo(0.08 * k, 0.056 * k, HIP_Z - KNEE_Z, 0.05), legMat));
      knee.add(mesh(new THREE.SphereGeometry(0.056 * k, 8, 6), legMat));
      if (bare) {
        // Икра с изгибом, тонкая щиколотка
        const shin = latheGeo([[0.029, -(KNEE_Z - ANKLE_Z) - 0.03], [0.031, -0.3], [0.046, -0.13], [0.047, -0.05], [0.049, 0.01]], 1, 10);
        knee.add(mesh(shin, skin));
      } else {
        knee.add(mesh(limbGeo(0.056 * k, 0.05 * k, KNEE_Z - ANKLE_Z, 0.01), legMat));
      }
    }
    // Обувь: длина — условная стопа, пятка на 5 см за щиколоткой, носок чуть наружу
    const sr = (fem ? 0.037 : 0.043) * (robe ? 0.95 : 1);
    const shoe = mesh(new THREE.CapsuleGeometry(sr, FOOT_L * (fem ? 0.94 : 1) - sr * 2, 3, 10), shoeMat);
    shoe.scale.z = 0.72;
    shoe.position.set(0, FOOT_L * 0.22, -KNEE_Z + sr * 0.72);
    shoe.rotation.z = -0.12;
    knee.add(shoe);
    if (standing && side < 0) {
      // Вес на правой ноге: левая расслаблена — бедро вперёд, колено согнуто
      thigh.rotation.x = 0.13;
      knee.rotation.x = -0.24;
      shoe.rotation.x = 0.1;
    }
    body.add(hip);
    legs.push(hip);
  }
  if (standing) body.rotation.y = 0.022; // корпус над опорной ногой

  /* Корпус: профиль вращения — широкие плечи, узкая талия, таз */
  if (robe) {
    const hem = look.outfit === 'abaya' ? 0.24 : 0.215;
    const g = latheGeo([[hem, 0.025], [hem - 0.015, 0.3], [hipR + 0.02, 0.72], [hipR + 0.008, 0.9], [waistR + 0.02, 1.08], [chestR, 1.24], ...yoke(sw)], 0.66, 16);
    body.add(mesh(g, topMat));
  } else if (look.outfit === 'dress') {
    const g = latheGeo([[0.225, 0.47], [0.205, 0.62], [hipR + 0.012, 0.8], [hipR + 0.006, 0.9], [waistR + 0.004, 1.06], [chestR, 1.22], [chestR, 1.3], ...yoke(sw)], 0.68, 16);
    body.add(mesh(g, topMat));
  } else {
    // Брюки: таз до талии
    body.add(mesh(latheGeo([[0.02, 0.78], [0.11, 0.786], [hipR - 0.012, 0.83], [hipR, 0.88], [hipR - 0.012, 0.94], [waistR - 0.004, 1.0], [waistR - 0.012, 1.04]]), botMat));
    // Пиджак закрывает таз, свитер — до пояса
    const hemPts: [number, number][] = jacket
      ? [[hipR + 0.006, 0.83], [hipR + 0.004, 0.9], [hipR - 0.004, 0.95], [waistR + 0.012, 1.0], [waistR + 0.004, 1.05]]
      : [[hipR - 0.004, 0.93], [waistR + 0.01, 0.99], [waistR + 0.004, 1.05]];
    body.add(mesh(latheGeo([...hemPts, [waistR + 0.01, 1.13], [chestR - 0.014, 1.22], [chestR, 1.31], ...yoke(sw)]), topMat));
    if (jacket) {
      // Вырез пиджака: белая рубашка клином, у костюма — галстук
      const v = new THREE.BufferGeometry();
      v.setAttribute('position', new THREE.Float32BufferAttribute([-0.04, 0, 0.15, 0.04, 0, 0.15, 0, 0, 0], 3));
      v.computeVertexNormals();
      const shirt = mesh(v, new THREE.MeshStandardMaterial({ color: '#f2f2ec', roughness: 0.7, side: THREE.DoubleSide }), false);
      shirt.position.set(0, front(0, sw) + 0.005, 1.29);
      shirt.rotation.x = 0.09;
      body.add(shirt);
      if (look.outfit === 'suit') {
        const tie = mesh(new THREE.PlaneGeometry(0.022, 0.15), new THREE.MeshStandardMaterial({ color: '#6e2a36', roughness: 0.5, side: THREE.DoubleSide }), false);
        tie.rotation.x = -Math.PI / 2;
        tie.position.set(0, front(0, sw) + 0.008, 1.37);
        body.add(tie);
      }
    }
    if (look.outfit === 'staff') {
      const bx = fem ? 0.07 : 0.08;
      const by = front(bx, chestR);
      const badge = mesh(new THREE.PlaneGeometry(0.07, 0.09), new THREE.MeshStandardMaterial({ color: '#d2d8a8', roughness: 0.4, side: THREE.DoubleSide }), false);
      badge.rotation.set(-Math.PI / 2, 0, -Math.atan((bx * DEPTH * DEPTH) / by), 'ZXY'); // по изгибу груди
      badge.position.set(bx, by + 0.004, 1.27);
      body.add(badge);
    }
  }

  /* Руки: дельта → плечо → локоть (лёгкий сгиб) → предплечье → кисть. Левая — зеркало. */
  const flare = look.outfit === 'abaya';
  const bareArm = look.outfit === 'dress';
  for (const side of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(side * shX, 0, SHOULDER_Z);
    sh.scale.x = side;
    const a = new THREE.Group();
    a.rotation.y = -0.07; // кисть чуть отходит от бедра
    sh.add(a);
    const deltoid = mesh(new THREE.SphereGeometry(delt, 8, 6), topMat);
    deltoid.scale.z = 0.75; // дельта не торчит над линией плеч
    deltoid.position.z = -0.01;
    a.add(deltoid);
    a.add(mesh(limbGeo(0.05 * k, 0.043 * k, UPPER_ARM), topMat));
    const elbow = new THREE.Group();
    elbow.position.z = -UPPER_ARM;
    elbow.rotation.x = 0.2;
    a.add(elbow);
    const foreMat = bareArm ? skin : topMat;
    elbow.add(mesh(new THREE.SphereGeometry(bareArm ? 0.036 : 0.043 * k, 8, 6), foreMat));
    elbow.add(mesh(limbGeo(bareArm ? 0.035 : 0.042 * k, flare ? 0.07 : bareArm ? 0.026 : 0.035 * k, FOREARM), foreMat));
    if (jacket) {
      const cuff = mesh(limbGeo(0.034 * k, 0.033 * k, 0.018), cloth('#f2f2ec', 0.7), false);
      cuff.position.z = -FOREARM + 0.012;
      elbow.add(cuff);
    }
    // Кисть: ладонь к бедру, большой палец вперёд
    const hand = new THREE.Group();
    hand.position.z = -FOREARM;
    hand.rotation.x = 0.06;
    elbow.add(hand);
    const palm = mesh(new THREE.SphereGeometry(HAND_L / 3.4, 8, 6), skin);
    palm.scale.set(0.55 * k, 0.98 * k, 1.7);
    palm.position.z = -HAND_L * 0.47;
    hand.add(palm);
    const thumb = mesh(new THREE.SphereGeometry(0.016 * k, 6, 4), skin, false);
    thumb.scale.set(1, 1, 2);
    thumb.position.set(-0.012, 0.03 * k, -0.045);
    thumb.rotation.x = -0.4;
    hand.add(thumb);
    body.add(sh);
    arms.push(sh);
  }

  /* Шея и голова */
  body.add(mesh(limbGeo(0.05 * k, 0.057 * k, 0.13).translate(0, 0, 1.575), skin));
  const headG = new THREE.Group();
  headG.position.z = HEAD_Z;
  headG.scale.setScalar(HEAD_S);
  body.add(headG);
  const head = mesh(new THREE.SphereGeometry(0.1, 18, 12), skin);
  head.scale.set(0.9, 0.98, 1.16);
  headG.add(head);
  // Лицо, нос и уши
  head.add(mesh(faceGeo, new THREE.MeshStandardMaterial({ map: faceTexture(look), roughness: 0.55 }), false));
  const nose = mesh(new THREE.ConeGeometry(0.016, 0.045, 8).rotateX(-0.25), skin, false);
  nose.position.set(0, 0.104, -0.012);
  head.add(nose);
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.024, 6, 5), skin, false);
    ear.scale.set(0.45, 0.8, 1.2);
    ear.position.set(side * 0.1, 0, -0.005);
    head.add(ear);
  }
  // Головные уборы и волосы — от центра головы, вместе с ней в масштабе
  if (look.outfit === 'kandura') {
    // Гутра и агаль
    const g = new THREE.CylinderGeometry(0.11, 0.2, 0.36, 16, 1, true, Math.PI * 0.35, Math.PI * 1.3);
    g.rotateX(Math.PI / 2);
    const scarf = mesh(g, new THREE.MeshStandardMaterial({ color: '#f6f6f2', roughness: 0.8, side: THREE.DoubleSide }));
    scarf.position.z = -0.08;
    headG.add(scarf);
    const top = mesh(new THREE.SphereGeometry(0.115, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), cloth('#f6f6f2', 0.8));
    top.position.z = 0.03;
    headG.add(top);
    const agal = mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), cloth('#111111', 0.5));
    agal.position.z = 0.09;
    headG.add(agal);
  } else if (look.outfit === 'abaya') {
    const sh = mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62).rotateX(Math.PI / 2), cloth(look.top, 0.55));
    sh.scale.set(1, 1.05, 1.12);
    sh.position.z = -0.01;
    sh.rotation.x = -0.25;
    headG.add(sh);
    const drape = mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.22, 16, 1, true).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: look.top, roughness: 0.55, side: THREE.DoubleSide }));
    drape.position.z = -0.16;
    headG.add(drape);
  } else {
    const hair = mesh(new THREE.SphereGeometry(0.106, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).rotateX(Math.PI / 2), cloth(look.hair, 0.7));
    hair.scale.set(0.93, 1.02, 1.18);
    hair.position.set(0, -0.012, 0.01);
    hair.rotation.x = -0.35;
    headG.add(hair);
    if (look.long) {
      // Хвост/каре сзади до лопаток
      const back = mesh(new THREE.CapsuleGeometry(0.07, 0.2, 3, 10), cloth(look.hair, 0.7));
      back.scale.set(1.15, 0.38, 1);
      back.position.set(0, -0.086, -0.12);
      back.rotation.x = 0.12;
      headG.add(back);
    }
  }
  const s = look.height ?? 1;
  body.scale.set(s, s, s);
  return { root, legs, arms };
}

/* ---------- Сцена ---------- */
/** `fonts` — загрузка шрифтов текстур (без ограничения по времени): когда придёт, текст перерисуем. */
export async function createStand3D(root: HTMLElement, canvas: HTMLCanvasElement, fonts: Promise<unknown> = Promise.resolve()) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const L = root.dataset;
  const photos: string[] = JSON.parse(L.photos || '[]');
  const narrow = () => root.clientWidth < 600;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;
  scene.fog = new THREE.Fog(0x0f100d, 26, 62);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  // Точка взгляда чуть выше пола: стенд опускается в кадре, и над фермой
  // остаётся место для подвесного баннера даже при низкой камере.
  const TARGET = new THREE.Vector3(4, 3, 1.5);

  /* Свет */
  scene.add(new THREE.HemisphereLight(0xc9c3d8, 0x16120f, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
  key.position.set(-5, 11, 14);
  key.target.position.set(4, 3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xc190c8, 0.7);
  rim.position.set(12, -6, 6);
  scene.add(rim);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Пол павильона: тёмный полированный бетон с сеткой */
  const hall = mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#0e0f0c', roughness: 0.92, metalness: 0, envMapIntensity: 0.12, map: noiseTex(256, [60, 60, 56], 30, 18) }), false);
  hall.position.set(4, 3, -0.002);
  scene.add(hall);
  const grid = new THREE.GridHelper(30, 30, 0x5d5f5b, 0x34352f);
  grid.rotation.x = Math.PI / 2;
  grid.position.set(4, 3, 0.002);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.22;
  scene.add(grid);

  /* Разметка площадки */
  const plot = new THREE.Group();
  const dashMat = new THREE.LineDashedMaterial({ color: '#d2d8a8', dashSize: 0.3, gapSize: 0.22, transparent: true });
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([[0, 0], [8, 0], [8, 6], [0, 6], [0, 0]].map(([x, y]) => new THREE.Vector3(x, y, 0.01))), dashMat);
  outline.computeLineDistances();
  plot.add(outline);
  const dimMat = new THREE.LineBasicMaterial({ color: '#d2d8a8', transparent: true });
  plot.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(
        [
          [0, 6.7, 8, 6.7],
          [0, 6.5, 0, 6.9],
          [8, 6.5, 8, 6.9],
          [8.7, 0, 8.7, 6],
          [8.5, 0, 8.9, 0],
          [8.5, 6, 8.9, 6],
        ].flatMap(([a, b, c, d]) => [new THREE.Vector3(a, b, 0.01), new THREE.Vector3(c, d, 0.01)]),
      ),
      dimMat,
    ),
  );
  const label = (text: string, w: number, h: number, px: number, weight = 700) => {
    const t = canvasTex(512, Math.round((512 * h) / w), (c) => {
      c.clearRect(0, 0, 512, 512);
      c.fillStyle = '#d2d8a8';
      c.font = `${weight} ${px}px ${FONT}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, 256, (512 * h) / w / 2);
    });
    const m = new THREE.Mesh(decalGeo(w, h, '+z'), new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, depthWrite: false }));
    return { m, t };
  };
  const area = label(L.area!, 4, 1.2, 130, 800);
  area.m.position.set(2, 2.4, 0.012);
  const dw = label(L.w!, 2, 0.6, 120);
  dw.m.position.set(3, 6.85, 0.012);
  const dd = label(L.d!, 2, 0.6, 120);
  dd.m.rotation.z = Math.PI / 2;
  dd.m.position.set(9.3, 2, 0.012);
  plot.add(area.m, dw.m, dd.m);
  scene.add(plot);
  const labels = [area, dw, dd];

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Логистика: деревянные ящики */
  const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.85 });
  const CRATES: [number, number, number, number, number, number][] = [
    [2.6, 2.0, 0, 1.2, 1.0, 0.9],
    [4.0, 2.2, 0, 1.0, 1.0, 1.1],
    [3.1, 3.3, 0, 1.4, 1.0, 0.8],
    [2.8, 2.15, 0.9, 0.8, 0.7, 0.6],
  ];
  const crates = CRATES.map(([, , , w, d, h]) => {
    const m = mesh(boxGeo(w, d, h), wood);
    scene.add(m);
    return m;
  });

  /* Подиум с ковром и алюминиевым кантом */
  const carpet = new THREE.MeshStandardMaterial({ color: '#4a2c50', roughness: 1, map: noiseTex(256, [200, 200, 200], 70, 10), bumpMap: noiseTex(256, [128, 128, 128], 120, 14), bumpScale: 0.6 });
  const floorG = new THREE.Group();
  floorG.add(mesh(boxGeo(8, 6, F), carpet, false));
  const alu = new THREE.MeshStandardMaterial({ color: '#c9cbc2', metalness: 0.9, roughness: 0.28 });
  for (const [x, y, w, d] of [
    [0, 6, 8, 0.03],
    [8, 0, 0.03, 6.03],
  ]) {
    const edge = mesh(boxGeo(w, d, F + 0.005), alu, false);
    edge.position.set(x, y, 0);
    floorG.add(edge);
  }
  scene.add(floorG);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Стены из модульных панелей */
  const paint = new THREE.MeshStandardMaterial({ color: '#efefea', roughness: 0.9 });
  const paintSide = new THREE.MeshStandardMaterial({ color: '#e4e5df', roughness: 0.9 });
  const back = [0, 1, 2, 3].map((i) => {
    const m = mesh(boxGeo(1.99, 0.12, 3), paint);
    m.position.set(i * 2 + 0.005, -0.12, F);
    scene.add(m);
    return m;
  });
  const side = [0, 1, 2].map((j) => {
    const m = mesh(boxGeo(0.12, 1.99, 3), paintSide);
    m.position.set(-0.12, j * 2 + 0.005, F);
    scene.add(m);
    return m;
  });
  const storage = mesh(boxGeo(1.8, 1.5, 2.6), new THREE.MeshStandardMaterial({ color: '#e6e7e1', roughness: 0.85 }));
  storage.position.set(0, 0, F);
  scene.add(storage);
  const doorTex = canvasTex(256, 512, (c) => {
    c.fillStyle = '#c9cbc2';
    c.fillRect(0, 0, 256, 512);
    c.strokeStyle = 'rgba(15,16,13,0.35)';
    c.lineWidth = 6;
    c.strokeRect(3, 3, 250, 506);
    c.fillStyle = '#59335f';
    c.fillRect(196, 250, 30, 10);
  });
  const door = mesh(decalGeo(0.8, 2.0, '+x'), new THREE.MeshStandardMaterial({ map: doorTex.tex, roughness: 0.5 }), false);
  door.position.set(1.802, 0.25, F);
  scene.add(door);

  /* Печать на задней стене: арка-логотип, «под ключ» и фото работы */
  let printImg: HTMLImageElement | null = null;
  const printTex = canvasTex(1536, 410, (c) => {
    c.fillStyle = '#59335f';
    c.fillRect(0, 0, 1536, 410);
    c.strokeStyle = '#d2d8a8';
    c.lineWidth = 40;
    c.beginPath();
    c.moveTo(120, 410);
    c.lineTo(120, 180);
    c.arc(256, 180, 136, Math.PI, 0);
    c.lineTo(392, 410);
    c.stroke();
    c.fillStyle = '#d2d8a8';
    c.beginPath();
    c.moveTo(225, 410);
    c.lineTo(225, 250);
    c.arc(256, 250, 31, Math.PI, 0);
    c.lineTo(287, 410);
    c.fill();
    c.font = `600 190px ${SCRIPT}`;
    c.fillText(L.script!, 470, 262);
    c.fillStyle = 'rgba(242,242,236,0.85)';
    c.font = `800 54px ${FONT}`;
    c.fillText('SIGNUP DXB', 492, 360);
    if (printImg) {
      cover(c, printImg, 1130, 30, 360, 350);
      c.strokeStyle = '#f2f2ec';
      c.lineWidth = 10;
      c.strokeRect(1130, 30, 360, 350);
    }
  });
  printTex.tex.wrapS = THREE.ClampToEdgeWrapping;
  const printMat = new THREE.MeshStandardMaterial({ map: printTex.tex, roughness: 0.75 });
  const print = mesh(decalGeo(6, 1.6, '+y'), printMat, false);
  // Наклейка смотрит в +y, её «левый» край — у x = 8: печать клеится от угла стенда.
  print.position.set(8, 0.003, F + 1.4);
  scene.add(print);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* LED-экран на боковой стене: слайдшоу реальных работ */
  const imgs: (HTMLImageElement | null)[] = [];
  let ledShown = -1;
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 6;
  const pc = pixel.getContext('2d')!;
  pc.fillStyle = 'rgba(0,0,0,0.35)';
  pc.fillRect(0, 0, 6, 6);
  pc.clearRect(1, 1, 4, 4);
  const ledTex = canvasTex(768, 435, (c) => {
    c.fillStyle = '#120a14';
    c.fillRect(0, 0, 768, 435);
  });
  const drawLed = (a: number, b: number, mixAB: number) => {
    const c = ledTex.ctx;
    c.fillStyle = '#120a14';
    c.fillRect(0, 0, 768, 435);
    const ia = imgs[a];
    const ib = imgs[b];
    if (ia) {
      c.globalAlpha = 1;
      cover(c, ia, 0, 0, 768, 435);
    }
    if (ib && mixAB > 0) {
      c.globalAlpha = mixAB;
      cover(c, ib, 0, 0, 768, 435);
    }
    c.globalAlpha = 1;
    const grad = c.createLinearGradient(0, 300, 0, 435);
    grad.addColorStop(0, 'rgba(18,10,20,0)');
    grad.addColorStop(1, 'rgba(18,10,20,0.85)');
    c.fillStyle = grad;
    c.fillRect(0, 300, 768, 135);
    c.fillStyle = '#fff';
    c.font = `800 44px ${FONT}`;
    c.fillText('SIGNUP DXB', 34, 404);
    c.fillStyle = '#d2d8a8';
    c.font = `600 60px ${SCRIPT}`;
    c.fillText(L.script!, 340, 408);
    c.fillStyle = c.createPattern(pixel, 'repeat')!;
    c.fillRect(0, 0, 768, 435);
    ledTex.tex.needsUpdate = true;
  };
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTex.tex, toneMapped: false, color: 0x000000 });
  const led = mesh(decalGeo(3, 1.7, '+x'), ledMat, false);
  led.position.set(0.004, 2.0, 0.9);
  const ledFrame = mesh(boxGeo(0.06, 3.12, 1.82), new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.4, metalness: 0.4 }), false);
  ledFrame.position.set(-0.05, 1.94, 0.84);
  scene.add(ledFrame, led);
  const glow = glowTex(true);
  const ledGlow = new THREE.Mesh(decalGeo(4.2, 2.6, '+x'), new THREE.MeshBasicMaterial({ map: glow, color: '#9b6aa3', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  ledGlow.position.set(0.02, 1.4, 0.45);
  scene.add(ledGlow);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Ферма и прожекторы */
  const chrome = new THREE.MeshStandardMaterial({ color: '#d9dbd4', metalness: 1, roughness: 0.22 });
  const TOP = 3.75;
  const colGeo = trussGeo(TOP);
  colGeo.rotateY(-Math.PI / 2); // вдоль +z
  const cols = [
    [7.95, 0.2],
    [7.95, 5.85],
    [0.2, 5.85],
  ].map(([x, y]) => {
    const m = mesh(colGeo, chrome);
    m.position.set(x, y, 0);
    scene.add(m);
    return m;
  });
  const beams = new THREE.Group();
  const bx = mesh(trussGeo(7.75), chrome);
  bx.position.set(0.2, 5.85, 0);
  const byGeo = trussGeo(5.65);
  byGeo.rotateZ(Math.PI / 2);
  const by = mesh(byGeo, chrome);
  by.position.set(7.95, 0.2, 0);
  beams.add(bx, by);
  scene.add(beams);
  const SPOTS: [number, number, number, number][] = [
    [2, 5.85, 2.2, 4.4],
    [4, 5.85, 4.1, 3.6],
    [6, 5.85, 6.2, 4.8],
    [7.95, 2, 6.7, 1.7],
    [7.95, 4, 6.4, 3.4],
  ];
  const lampMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.35, metalness: 0.6 });
  const lensMat = new THREE.MeshBasicMaterial({ color: '#fff6e0', toneMapped: false });
  const coneTex = glowTex(false);
  const spots = SPOTS.map(([lx, ly, fx, fy]) => {
    const g = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.26, 16), lampMat);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.085, 16), lensMat);
    lens.position.y = -0.131;
    lens.rotation.x = Math.PI / 2;
    body.add(lens);
    g.add(body);
    const dir = new THREE.Vector3(fx - lx, fy - ly, F - (TOP - 0.3)).normalize();
    body.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const light = new THREE.SpotLight(0xfff1dc, 0, 9, 0.42, 0.65, 1.6);
    light.position.set(0, 0, 0);
    light.target.position.set(fx - lx, fy - ly, F - (TOP - 0.3));
    g.add(light, light.target);
    // Видимый конус света
    const len = Math.hypot(fx - lx, fy - ly, TOP - 0.3 - F);
    const cg = new THREE.ConeGeometry(0.75, len, 32, 1, true);
    cg.translate(0, -len / 2, 0);
    const cone = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: coneTex, color: '#fff1dc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide }));
    cone.quaternion.copy(body.quaternion);
    g.add(cone);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), new THREE.MeshBasicMaterial({ map: glow, color: '#fff1dc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.position.set(fx - lx, fy - ly, F - (TOP - 0.3) + 0.01);
    g.add(pool);
    beams.add(g);
    g.position.set(lx, ly, TOP - 0.3);
    return { g, light, cone, pool, body };
  });

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Баннер-кольцо на тросах. Висит низко над фермой — иначе на крупных
     планах уходит за верхний край сцены. */
  const banner = new THREE.Group();
  const HANG = 4.2;
  const BX = 2.6;
  const BY = 1.6;
  const BS = 2.8;
  const BH = 0.7;
  const fabric = new THREE.MeshStandardMaterial({ color: '#59335f', roughness: 0.92 });
  const bannerTex = canvasTex(1024, 256, (c) => {
    c.fillStyle = '#59335f';
    c.fillRect(0, 0, 1024, 256);
    c.fillStyle = '#ffffff';
    c.font = `800 120px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SIGNUP DXB', 512, 136);
  });
  const bannerFace = new THREE.MeshStandardMaterial({ map: bannerTex.tex, roughness: 0.9 });
  const ringParts: [number, number, number, number, FaceDir, number, number][] = [
    [BX, BY - 0.002, BS, 0.05, '-y', BX, BY - 0.003],
    [BX, BY + BS - 0.05, BS, 0.05, '+y', BX + BS, BY + BS + 0.003],
    [BX - 0.002, BY, 0.05, BS, '-x', BX - 0.003, BY + BS],
    [BX + BS - 0.05, BY, 0.05, BS, '+x', BX + BS + 0.003, BY],
  ];
  for (const [x, y, w, d, dir, ox, oy] of ringParts) {
    const p = mesh(boxGeo(w, d, BH), fabric);
    p.position.set(x, y, 0);
    banner.add(p);
    const f = mesh(decalGeo(BS, BH, dir), bannerFace, false);
    f.position.set(ox, oy, 0);
    banner.add(f);
  }
  const cableMat = new THREE.LineBasicMaterial({ color: '#8d9086', transparent: true, opacity: 0.6 });
  banner.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(
        [
          [BX, BY],
          [BX + BS, BY],
          [BX + BS, BY + BS],
          [BX, BY + BS],
        ].flatMap(([x, y]) => [new THREE.Vector3(x, y, BH), new THREE.Vector3(x, y, BH + 8)]),
      ),
      cableMat,
    ),
  );
  scene.add(banner);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Мебель */
  const lacquer = new THREE.MeshPhysicalMaterial({ color: '#59335f', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12 });
  const corian = new THREE.MeshPhysicalMaterial({ color: '#f4f4f0', roughness: 0.3, clearcoat: 0.6 });
  const counter = new THREE.Group();
  counter.add(mesh(boxGeo(1.8, 0.7, 1.0), lacquer));
  const ctop = mesh(boxGeo(1.9, 0.78, 0.05), corian);
  ctop.position.set(-0.05, -0.04, 1.0);
  counter.add(ctop);
  const stripTex = canvasTex(1024, 128, (c) => {
    c.fillStyle = '#f6f8e6';
    c.fillRect(0, 0, 1024, 128);
    c.fillStyle = '#2b2c27';
    c.font = `800 74px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SIGNUP DXB', 512, 68);
  });
  const stripMat = new THREE.MeshBasicMaterial({ map: stripTex.tex, toneMapped: false, color: 0x2a2b26 });
  const strip = new THREE.Mesh(decalGeo(1.8, 0.24, '+y'), stripMat);
  strip.position.set(1.8, 0.702, 0.62);
  counter.add(strip);
  counter.position.set(5.3, 4.6, F);
  scene.add(counter);

  const blackGloss = new THREE.MeshPhysicalMaterial({ color: '#1b1c1a', roughness: 0.3, clearcoat: 0.8 });
  const bar = new THREE.Group();
  bar.add(mesh(boxGeo(2.4, 0.65, 1.0), blackGloss));
  const btop = mesh(boxGeo(2.5, 0.72, 0.05), corian);
  btop.position.set(-0.05, -0.03, 1.0);
  bar.add(btop);
  bar.position.set(2.6, 0.25, F);
  scene.add(bar);
  const steel = new THREE.MeshStandardMaterial({ color: '#b9bbb5', metalness: 1, roughness: 0.3 });
  const machine = new THREE.Group();
  machine.add(mesh(boxGeo(0.42, 0.38, 0.46), steel));
  const mtop = mesh(boxGeo(0.42, 0.38, 0.04), lacquer);
  mtop.position.z = 0.46;
  machine.add(mtop);
  for (let i = 0; i < 3; i++) {
    const cup = mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.09, 16).rotateX(Math.PI / 2), corian);
    cup.position.set(0.8 + i * 0.25, 0.2, 0.045);
    machine.add(cup);
  }
  machine.position.set(2.8, 0.35, F + 1.05);
  scene.add(machine);

  const fabricOlive = new THREE.MeshStandardMaterial({ color: '#b9c08a', roughness: 0.95 });
  const stools = [0, 1].map((i) => {
    const g = new THREE.Group();
    const leg = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 12).rotateX(Math.PI / 2), steel);
    leg.position.z = 0.35;
    const base = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24).rotateX(Math.PI / 2), steel);
    const seat = mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.08, 24).rotateX(Math.PI / 2), fabricOlive);
    seat.position.z = 0.72;
    g.add(leg, base, seat);
    g.position.set(3.4 + i * 1.1, 1.4, F);
    scene.add(g);
    return g;
  });
  const table = new THREE.Group();
  const tpole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 12).rotateX(Math.PI / 2), steel);
  tpole.position.z = 0.36;
  const tbase = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 32).rotateX(Math.PI / 2), steel);
  const ttop = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 40).rotateX(Math.PI / 2), corian);
  ttop.position.z = 0.73;
  table.add(tpole, tbase, ttop);
  table.position.set(2.4, 3.4, F);
  scene.add(table);
  const chairs = [
    [1.55, 3.4, 0],
    [2.4, 2.55, Math.PI / 2],
    [3.25, 3.4, Math.PI],
  ].map(([x, y, a]) => {
    const g = new THREE.Group();
    const seat = mesh(boxGeo(0.46, 0.46, 0.1), fabricOlive);
    seat.position.set(-0.23, -0.23, 0.4);
    const backr = mesh(boxGeo(0.08, 0.46, 0.45), fabricOlive);
    backr.position.set(-0.27, -0.23, 0.48);
    const legs = mesh(boxGeo(0.04, 0.04, 0.4), steel);
    legs.position.set(-0.02, -0.02, 0);
    g.add(seat, backr, legs);
    g.rotation.z = a;
    g.position.set(x, y, F);
    scene.add(g);
    return g;
  });
  const whiteGloss = new THREE.MeshPhysicalMaterial({ color: '#f6f6f2', roughness: 0.2, clearcoat: 1 });
  const PODS: [number, number, number][] = [
    [6.4, 1.2, 0.9],
    [7.1, 2.1, 1.1],
    [6.3, 2.4, 0.7],
  ];
  const productMats = [
    new THREE.MeshPhysicalMaterial({ color: '#c190c8', metalness: 0.3, roughness: 0.15, clearcoat: 1 }),
    new THREE.MeshStandardMaterial({ color: '#d9dbd4', metalness: 1, roughness: 0.12 }),
    new THREE.MeshPhysicalMaterial({ color: '#879152', roughness: 0.35, clearcoat: 0.8 }),
  ];
  const pods = PODS.map(([x, y, h], i) => {
    const g = new THREE.Group();
    const base = mesh(boxGeo(0.55, 0.55, h), whiteGloss);
    g.add(base);
    const item = mesh(i === 1 ? new THREE.SphereGeometry(0.15, 32, 24) : i === 0 ? new THREE.TorusKnotGeometry(0.1, 0.035, 80, 12) : boxGeo(0.25, 0.25, 0.3), productMats[i]);
    if (i === 2) item.position.set(0.15, 0.15, h);
    else item.position.set(0.275, 0.275, h + 0.17);
    g.add(item);
    g.position.set(x, y, F);
    scene.add(g);
    return { g, item, base, h };
  });
  const leafMats = ['#4f5a25', '#66712f', '#879152'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true }));
  const plants = [
    [7.4, 0.4],
    [0.45, 5.35],
  ].map(([x, y]) => {
    const g = new THREE.Group();
    const pot = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.45, 24).rotateX(Math.PI / 2), whiteGloss);
    pot.position.z = 0.225;
    g.add(pot);
    let seed = Math.round(x * 13 + y * 7);
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 14; k++) {
      const leaf = mesh(new THREE.IcosahedronGeometry(0.09 + r() * 0.08, 0), leafMats[k % 3]);
      const a = r() * Math.PI * 2;
      const rad = r() * 0.22;
      leaf.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0.55 + r() * 0.75);
      leaf.scale.set(1, 1, 1.6);
      g.add(leaf);
    }
    g.position.set(x, y, F);
    scene.add(g);
    return g;
  });
  const rollTex = canvasTex(256, 576, (c) => {
    c.fillStyle = '#f4f4f0';
    c.fillRect(0, 0, 256, 576);
    c.fillStyle = '#59335f';
    c.fillRect(0, 0, 256, 220);
    c.strokeStyle = '#d2d8a8';
    c.lineWidth = 22;
    c.beginPath();
    c.moveTo(78, 220);
    c.lineTo(78, 140);
    c.arc(128, 140, 50, Math.PI, 0);
    c.lineTo(178, 220);
    c.stroke();
    c.fillStyle = '#59335f';
    c.font = `800 34px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('SIGNUP DXB', 128, 290);
    c.fillStyle = '#879152';
    c.font = `600 52px ${SCRIPT}`;
    c.fillText(L.script!, 128, 350);
  });
  const rollup = new THREE.Group();
  const rbase = mesh(boxGeo(0.88, 0.16, 0.07), steel);
  const sheet = mesh(decalGeo(0.85, 2.0, '+y'), new THREE.MeshStandardMaterial({ map: rollTex.tex, roughness: 0.8, side: THREE.DoubleSide }));
  sheet.position.set(0.865, 0.08, 0.07);
  rollup.add(rbase, sheet);
  rollup.position.set(0.3, 5.3, F);
  scene.add(rollup);

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* Люди */
  const staffLook = (skin: number, hair: number, long: boolean, height: number): Look => ({ skin: SKIN[skin], hair: HAIR[hair], outfit: 'staff', top: '#59335f', bottom: '#1c1e1f', long, height, female: long });
  const STAFF = [
    { x: 6.2, y: 4.25, h: 0, on: 17.6, look: staffLook(0, 1, true, 0.97) },
    { x: 1.0, y: 3.6, h: -1.2, on: 17.8, look: staffLook(2, 2, false, 1.04) },
    { x: 3.9, y: 1.05, h: 0, on: 18.0, look: staffLook(1, 0, true, 0.96) },
    { x: 2.4, y: 4.0, h: 0.3, on: 18.2, look: staffLook(3, 2, false, 1.02) },
  ];
  const staff = STAFF.map((s) => {
    const p = makePerson(s.look);
    p.root.position.set(s.x, s.y, F);
    p.root.rotation.z = s.h;
    scene.add(p.root);
    return p;
  });
  const staffS = STAFF.map((s, i) => tr(0, [[s.on, 1], [25.6 + i * 0.1, 0]], SNAP));
  type Guest = { pts: [number, number][]; from: number; to: number; look: Look };
  const GUESTS: Guest[] = [
    { pts: [[-2, 7.3], [10, 7.3]], from: 18.2, to: 27.4, look: { skin: SKIN[4], hair: HAIR[3], outfit: 'suit', top: '#2b3550', bottom: '#2b3550', height: 1.03 } },
    { pts: [[10, 7.9], [-2, 7.9]], from: 18.8, to: 28.0, look: { skin: SKIN[1], hair: HAIR[0], outfit: 'kandura', top: '#f4f4ef', bottom: '#f4f4ef', height: 1.05, beard: true } },
    { pts: [[9.5, 6.8], [6.8, 6.8], [6.4, 5.7], [6.4, 5.7], [6.4, 5.7]], from: 18.4, to: 26.4, look: { skin: SKIN[2], hair: HAIR[0], outfit: 'abaya', top: '#151515', bottom: '#151515', height: 0.95, female: true } },
    { pts: [[-2, 6.9], [4.8, 6.9], [4.6, 4.9], [4.6, 4.9], [4.6, 4.9]], from: 19.0, to: 26.6, look: { skin: SKIN[0], hair: HAIR[4], outfit: 'dress', top: '#7d874a', bottom: '#7d874a', long: true, height: 0.97, female: true, eyes: '#3d6b8a' } },
    { pts: [[10, 8.4], [-2, 8.4]], from: 19.6, to: 28.6, look: { skin: SKIN[3], hair: HAIR[2], outfit: 'casual', top: '#c9cbc2', bottom: '#2b3550', height: 1.0 } },
  ];
  const guests = GUESTS.map((g) => {
    const p = makePerson(g.look);
    scene.add(p.root);
    return p;
  });
  const at = (g: Guest, u: number): [number, number, number, number] => {
    const n = g.pts.length - 1;
    const f = clamp(u) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const r = f - i;
    const a = g.pts[i];
    const c = g.pts[i + 1];
    return [lerp(a[0], c[0], r), lerp(a[1], c[1], r), c[0] - a[0], c[1] - a[1]];
  };

  await breathe(); // короткая пауза: сборка сцены не блокирует страницу одной длинной задачей
  /* ---------- Сценарий (те же доли, что у 2D-версии) ---------- */
  // Ближе всего и ниже всего камера, пока висит баннер (доли 14–27): дистанцию и
  // угол подобрали так, чтобы баннер сверху и угол подиума снизу оставались в кадре.
  const camDist = tr(42, [[3.0, 16.5], [16, 15.5], [20, 13.7], [27, 16.2], [32, 17], [36.6, 42]], SOFT);
  const camEl = tr(62, [[3.0, 31], [16, 27], [20, 17], [26.5, 21], [32, 32], [36.6, 62]], SOFT);
  const camDev = tr(0, [[7, -13], [16, -44], [22, -48], [26, -44], [29, -6], [34, 14], [38.5, 0]], SOFT);
  const plotOn = tr(1, [[7.2, 0], [36.0, 1]], FAST);
  const crateSlide = CRATES.map((_, i) => tr(10, [[2.4 + i * 0.3, 0], [33.4 + i * 0.25, 10]], DROP));
  const crateVis = CRATES.map((_, i) => tr(0, [[2.4 + i * 0.3, 1], [7.0, 0], [31.0, 1], [35.6, 0]], FAST));
  const floorIn = wn(7.0, 31.2);
  const floorDrop = tr(3, [[7.0, 0], [30.6, 3]], DROP);
  const backH = back.map((_, i) => tr(0, [[7.8 + i * 0.3, 1], [29.6 - i * 0.15, 0]], DROP));
  const sideH = side.map((_, j) => tr(0, [[8.6 + j * 0.3, 1], [29.8 - j * 0.15, 0]], DROP));
  const storageH = tr(0, [[9.6, 1], [29.2, 0]], DROP);
  const colH = tr(0, [[10.2, 1], [28.8, 0]], DROP);
  const beamD = tr(3.5, [[10.8, 0], [28.5, 3.5]], DROP);
  const beamV = wn(10.8, 28.7);
  const lampV = SPOTS.map((_, i) => wn(11.4 + i * 0.15, 28.3, SNAP));
  const beamOn = SPOTS.map((_, i) => wn(18.2 + i * 0.15, 25.6));
  const ledVisT = wn(9.4, 29.4, SNAP);
  const ledOnT = wn(13.6, 27.6);
  const bannerDrop = tr(5, [[14.0, 0], [27.4, 5]], DROP);
  const bannerV = wn(14.0, 27.8);
  const counterH = tr(0, [[14.6, 1], [27.0, 0]], DROP);
  const stripT = wn(15.2, 26.8);
  const barH = tr(0, [[15.0, 1], [26.9, 0]], DROP);
  const machineV = wn(15.4, 26.7, SNAP);
  const stoolH = stools.map((_, i) => tr(0, [[15.6 + i * 0.2, 1], [26.6, 0]], DROP));
  const tableH = tr(0, [[15.8, 1], [26.4, 0]], DROP);
  const chairH = chairs.map((_, i) => tr(0, [[16.0 + i * 0.2, 1], [26.3, 0]], DROP));
  const podH = pods.map((_, i) => tr(0, [[16.2 + i * 0.2, 1], [26.2, 0]], DROP));
  const podItem = pods.map((_, i) => wn(16.6 + i * 0.2, 26.0, SNAP));
  const plantV = plants.map((_, i) => wn(16.8 + i * 0.2, 25.9, SNAP));
  const rollH = tr(0, [[17.0, 1], [25.8, 0]], DROP);

  /* Чек-лист и подписи этапов (SVG поверх холста) */
  const checks = [...root.querySelectorAll('[data-check]')] as SVGGElement[];
  const caps = [...root.querySelectorAll('[data-cap]')] as SVGGElement[];
  const ckFill = checks.map((c) => c.querySelector('[data-ck-fill]') as SVGElement);
  const ckTick = checks.map((c) => c.querySelector('[data-ck-tick]') as SVGElement);
  const ckLabel = checks.map((c) => c.querySelector('[data-ck-label]') as SVGElement);
  const checksGroup = root.querySelector<SVGGElement>('.hs__checks'); // чек-листа на главной может не быть
  const ticks = [3.6, 11.4, 14.2, 16.0, 18.0].map((on, i) => tr(0, [[on, 1], [33.4 + i * 0.2, 0]], SNAP));
  // Подписи этапов строго по порядку 1 → 6, в такт сцене (доли из 40):
  // 1 бриф — подлёт к пустой площадке (36 → 3,5, через стык петли), 2 смета — разметка и ящики,
  // 3 площадка — пол и стены, 4 производство — ферма, печать, баннер, мебель,
  // 5 монтаж и работа — люди и свет, 6 демонтаж.
  const capVis = [tr(1, [[3.5, 0], [36.15, 1]], FAST), wn(3.65, 7.0), wn(7.15, 11.0), wn(11.15, 16.0), wn(16.15, 27.0), wn(27.15, 36.0)];
  const checksVis = tr(1, [[19.6, 0], [32.6, 1]], SOFT);

  /* Шрифты и фото: дорисовать текстуры, когда загрузятся.
     Загрузчик ждёт шрифты до 2,5 с; если они пришли позже — перерисуем здесь. */
  const redrawText = () => {
    printTex.redraw();
    bannerTex.redraw();
    stripTex.redraw();
    rollTex.redraw();
    labels.forEach((l) => l.t.redraw());
    ledShown = -1;
  };
  fonts.then(redrawText);
  document.fonts?.addEventListener('loadingdone', redrawText);
  Promise.all(photos.map(loadImg)).then((list) => {
    list.forEach((im, i) => (imgs[i] = im));
    printImg = list[list.length - 1] ?? null;
    redrawText();
  });

  const pop = (o: THREE.Object3D, v: number) => {
    const s = Math.max(0.0001, v);
    o.visible = v > 0.01;
    o.scale.setScalar(s);
  };

  /* Качество подстраивается под устройство: если кадры не успевают, снижаем
     разрешение, потом тени и конусы света. Повышать обратно не пытаемся. */
  let quality = 0;
  let lastWidth = 0;
  let prevSeek = 0;
  let slow = 0;
  let samples = 0;
  const applyQuality = () => {
    const mobile = narrow();
    const dprCap = [mobile ? 1.25 : 1.35, 1.0, 0.8][quality];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    if (lastWidth) renderer.setSize(lastWidth, lastWidth, false);
    const sm = quality === 0 && !mobile ? 1024 : 512;
    if (key.shadow.mapSize.x !== sm) {
      key.shadow.mapSize.set(sm, sm);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    }
    key.castShadow = quality < 2;
    spots.forEach((s) => (s.cone.material as THREE.MeshBasicMaterial).visible = quality < 2);
  };
  const watch = () => {
    const nowMs = performance.now();
    const dt = nowMs - prevSeek;
    prevSeek = nowMs;
    if (dt <= 0 || dt > 250) return; // пауза, вкладка была скрыта
    samples++;
    if (dt > 24) slow++;
    if (samples >= 90) {
      if (slow > 30 && quality < 2) {
        quality++;
        applyQuality();
      }
      samples = slow = 0;
    }
  };

  function seek(t: number) {
    watch();
    t = wrap(t, LOOPT);
    const b = t / BEAT;

    /* Камера */
    const az = ((-40 + (360 * b) / LB + camDev(t)) * Math.PI) / 180;
    const el = (camEl(t) * Math.PI) / 180;
    // На узком экране камера ближе: стенд крупнее, а края кадра всё равно растворяются.
    const d = camDist(t) * (narrow() ? 0.84 : 1);
    camera.position.set(TARGET.x + d * Math.cos(el) * Math.cos(az), TARGET.y + d * Math.cos(el) * Math.sin(az), TARGET.z + d * Math.sin(el));
    camera.lookAt(TARGET);

    /* Площадка и логистика */
    const po = clamp(plotOn(t));
    plot.visible = po > 0.01;
    dashMat.opacity = dimMat.opacity = po;
    labels.forEach((l) => ((l.m.material as THREE.MeshBasicMaterial).opacity = po));
    CRATES.forEach((c, i) => {
      const s = crateSlide[i](t);
      const v = clamp(crateVis[i](t));
      crates[i].visible = v > 0.02;
      crates[i].position.set(c[0] + s * 0.25, c[1] + s, c[2]);
      crates[i].scale.setScalar(0.6 + 0.4 * v);
    });

    /* Пол */
    const fv = clamp(floorIn(t));
    floorG.visible = fv > 0.02;
    floorG.position.z = floorDrop(t);

    /* Стены, подсобка */
    back.forEach((w, i) => {
      const h = Math.max(0, backH[i](t));
      w.visible = h > 0.01;
      w.scale.z = Math.max(0.001, h);
    });
    side.forEach((w, j) => {
      const h = Math.max(0, sideH[j](t));
      w.visible = h > 0.01;
      w.scale.z = Math.max(0.001, h);
    });
    const sh = Math.max(0, storageH(t));
    storage.visible = sh > 0.01;
    storage.scale.z = Math.max(0.001, sh);
    door.visible = sh > 0.92;

    /* Печать клеится от угла */
    const pp = clamp(b < 20 ? ease((b - 12.0) / 1.6) : 1 - ease((b - 28.0) / 0.8));
    print.visible = pp > 0.002 && back[3].scale.z > 0.95;
    print.scale.x = Math.max(0.001, pp);
    printTex.tex.repeat.x = Math.max(0.001, pp);

    /* LED */
    const lv = clamp(ledVisT(t));
    const lo = clamp(ledOnT(t));
    led.visible = ledFrame.visible = lv > 0.02 && side[2].scale.z > 0.8;
    ledMat.color.setScalar(0.05 + 0.95 * lo);
    (ledGlow.material as THREE.MeshBasicMaterial).opacity = 0.32 * lo;
    ledGlow.visible = lo > 0.01;
    if (imgs.length) {
      const per = 2.5; // секунд на слайд
      const k = Math.max(0, t - 13.6 * BEAT);
      const idx = Math.floor(k / per) % Math.max(1, imgs.length - 1);
      const f = clamp(((k % per) - (per - 0.5)) / 0.5);
      const key2 = idx * 100 + Math.round(f * 10);
      if (key2 !== ledShown && lo > 0.01) {
        ledShown = key2;
        drawLed(idx, (idx + 1) % Math.max(1, imgs.length - 1), f);
      }
    }

    /* Ферма и свет */
    const ch = Math.max(0, colH(t));
    cols.forEach((c) => {
      c.visible = ch > 0.01;
      c.scale.set(1, 1, Math.max(0.001, ch));
    });
    const bv = clamp(beamV(t));
    beams.visible = bv > 0.01;
    beams.position.z = TOP - 0.15 + beamD(t);
    spots.forEach((s, i) => {
      const v = clamp(lampV[i](t));
      s.body.visible = v > 0.02;
      const o = clamp(beamOn[i](t));
      s.light.intensity = 26 * o;
      (s.cone.material as THREE.MeshBasicMaterial).opacity = 0.07 * o;
      (s.pool.material as THREE.MeshBasicMaterial).opacity = 0.45 * o;
      s.cone.visible = s.pool.visible = o > 0.01;
      lensMat.color.set(o > 0.5 ? '#fff6e0' : '#3a3a36');
    });

    /* Баннер */
    const rv = clamp(bannerV(t));
    banner.visible = rv > 0.01;
    banner.position.set(0, 0, HANG + bannerDrop(t));

    /* Мебель вырастает из пола */
    const grow = (o: THREE.Object3D, v: number) => {
      o.visible = v > 0.01;
      o.scale.set(1, 1, Math.max(0.001, v));
    };
    grow(counter, Math.max(0, counterH(t)));
    const so = clamp(stripT(t));
    stripMat.color.setScalar(0.16 + 0.84 * so);
    grow(bar, Math.max(0, barH(t)));
    pop(machine, Math.max(0, machineV(t)));
    machine.position.z = F + 1.05 * Math.max(0, barH(t));
    stools.forEach((s, i) => grow(s, Math.max(0, stoolH[i](t))));
    grow(table, Math.max(0, tableH(t)));
    chairs.forEach((c, i) => grow(c, Math.max(0, chairH[i](t))));
    pods.forEach((p, i) => {
      grow(p.g, Math.max(0, podH[i](t)));
      const iv = Math.max(0, podItem[i](t));
      p.item.visible = iv > 0.02;
      p.item.scale.set(iv, iv, iv / Math.max(0.05, p.g.scale.z));
      if (i === 0) p.item.rotation.z = t * 0.8;
    });
    plants.forEach((p, i) => pop(p, Math.max(0, plantV[i](t))));
    const rh = Math.max(0, rollH(t));
    rollup.visible = rh > 0.01;
    sheet.scale.z = Math.max(0.001, clamp(rh, 0, 1.08));

    /* Люди */
    staff.forEach((p, i) => {
      const v = Math.max(0, staffS[i](t));
      p.root.visible = v > 0.02;
      p.root.scale.setScalar(Math.max(0.001, v));
      const breathe = Math.sin(t * 2.1 + i * 1.7) * 0.03;
      p.root.rotation.z = STAFF[i].h + breathe;
      p.arms[0].rotation.x = 0.05 + breathe;
      p.arms[1].rotation.x = 0.05 - breathe;
    });
    GUESTS.forEach((g, i) => {
      const p = guests[i];
      const u = (b - g.from) / (g.to - g.from);
      if (u <= 0 || u >= 1) {
        p.root.visible = false;
        return;
      }
      p.root.visible = true;
      const [x, y, dx, dy] = at(g, u);
      const moving = Math.hypot(dx, dy) > 0.01;
      const onStand = y < 6 && x > 0 && x < 8;
      p.root.position.set(x, y, onStand ? F : 0);
      if (moving) p.root.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
      const ph = moving ? t * Math.PI * 3.4 + i : 0;
      const sw = moving ? Math.sin(ph) * 0.42 : 0;
      p.legs.forEach((l, k) => (l.rotation.x = k ? sw : -sw));
      p.arms.forEach((a, k) => (a.rotation.x = k ? -sw * 0.8 : sw * 0.8));
      p.root.position.z += moving ? Math.abs(Math.cos(ph)) * 0.025 : 0;
      p.root.scale.setScalar(clamp(Math.min(u, 1 - u) * 14, 0.001, 1));
    });

    renderer.render(scene, camera);

    /* Подписи поверх */
    if (checksGroup) checksGroup.style.opacity = clamp(checksVis(t)).toFixed(3);
    checks.forEach((_, i) => {
      const raw = ticks[i](t);
      const v = clamp(raw);
      ckFill[i].style.opacity = v.toFixed(3);
      ckFill[i].setAttribute('r', (9 * (0.6 + 0.4 * Math.max(0, raw))).toFixed(2));
      ckTick[i].style.strokeDashoffset = (1 - v).toFixed(3);
      ckLabel[i].style.opacity = (0.5 + 0.5 * v).toFixed(3);
    });
    caps.forEach((c, i) => {
      const v = clamp(capVis[i](t));
      c.style.display = v < 0.01 ? 'none' : '';
      c.style.opacity = v.toFixed(3);
      c.setAttribute('transform', `translate(22 ${(514 + (1 - v) * 10).toFixed(2)})`);
    });
  }

  function fit(width: number) {
    lastWidth = width;
    applyQuality();
    renderer.setSize(width, width, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  /* Прогрев: все шейдеры и текстуры готовим заранее, пока все предметы видимы.
     Иначе каждый новый материал компилируется в момент появления — отсюда рывки.
     Работа порезана на части с паузами, а шейдеры компилируются параллельно (compileAsync),
     чтобы страница не замирала на секунду, пока готовится сцена. */
  return (async () => {
    camera.position.set(4 + 16, 3 + 16, 12);
    camera.lookAt(TARGET);
    for (const s of spots) s.light.intensity = 1;
    const maps: THREE.Texture[] = [];
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && 'map' in m && m.map && !maps.includes(m.map)) maps.push(m.map);
    });
    for (let i = 0; i < maps.length; i++) {
      renderer.initTexture(maps[i]);
      if (i % 4 === 3) await breathe();
    }
    await breathe();
    await renderer.compileAsync(scene, camera);
    await breathe();
    renderer.setSize(Math.max(64, root.clientWidth), Math.max(64, root.clientWidth), false);
    renderer.render(scene, camera);
    for (const s of spots) s.light.intensity = 0;
    return { seek, fit };
  })();
}
