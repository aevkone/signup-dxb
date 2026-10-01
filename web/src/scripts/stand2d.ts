/**
 * Запасной рендер стенда на Canvas 2D (если у посетителя нет WebGL).
 * Островной стенд 48 м² собирается и разбирается в 3D.
 *
 * Перспективная камера на Canvas 2D: подлёт издалека сверху, облёт стенда
 * с разных сторон, отлёт в исходную точку — петля 20 с без стыка.
 * Грани, отвёрнутые от камеры, отсекаются; предметы рисуются от дальних
 * к ближним. Рисунки на гранях (печать, LED-экран, баннер, дверь) живут
 * в плоскости своей грани и исчезают вместе с ней, когда смотрим со спины.
 *
 * Мир в метрах: площадка 8 × 6, задняя стена вдоль y = 0, боковая — вдоль x = 0,
 * проход для посетителей — со стороны +y. Каждый кадр — чистая функция времени.
 */
import { BEAT, DROP, FAST, SNAP, SOFT, clamp, ease, lerp, track, win, wrap } from './spring';
import type { Spring, Key } from './spring';
import { drawPerson, HAIR, SKIN } from './stand-people';
import type { Look } from './stand-people';

type V3 = [number, number, number];
type Pt = [number, number, number]; // экранные x, y и глубина

/* ---------- Петля 40 долей = 20 с ---------- */
const LB = 40;
const LOOPT = LB * BEAT;
const tr = (v0: number, keys: Key[], s: Spring) => track(v0, keys, s, LOOPT);
const wn = (on: number, off: number, s: Spring = FAST) => win(on, off, s, LOOPT);
const STILL = 22 * BEAT;

/* ---------- Векторы ---------- */
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/* ---------- Камера ---------- */
const CX = 280;
const CY = 292;
const FOCAL = 720;
const TARGET: V3 = [4, 3, 1.1];
const cam = { pos: [0, 0, 0] as V3, r: [1, 0, 0] as V3, u: [0, 0, 1] as V3, f: [0, 1, 0] as V3 };
function setCam(azDeg: number, elDeg: number, d: number) {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  cam.pos = [TARGET[0] + d * Math.cos(el) * Math.cos(az), TARGET[1] + d * Math.cos(el) * Math.sin(az), TARGET[2] + d * Math.sin(el)];
  cam.f = norm(sub(TARGET, cam.pos));
  cam.r = norm(cross(cam.f, [0, 0, 1]));
  cam.u = cross(cam.r, cam.f);
}
function proj(p: V3): Pt | null {
  const v = sub(p, cam.pos);
  const z = dot(v, cam.f);
  if (z < 0.3) return null;
  return [CX + (FOCAL * dot(v, cam.r)) / z, CY - (FOCAL * dot(v, cam.u)) / z, z];
}
const dist = (p: V3) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);

/* ---------- Цвет и свет ---------- */
const LIGHT = norm([-0.35, 0.55, 0.8]);
function rgb(hex: string): V3 {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const shadeCss = (c: V3, f: number) => `rgb(${Math.min(255, c[0] * f) | 0} ${Math.min(255, c[1] * f) | 0} ${Math.min(255, c[2] * f) | 0})`;

const FONT = '"Montserrat Variable", Montserrat, system-ui, sans-serif';
const SCRIPT = 'Caveat, cursive';

/* ---------- Коробка ---------- */
type Face = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
const FACES: Face[] = ['+x', '-x', '+y', '-y', '+z', '-z'];
const NORMAL: Record<Face, V3> = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
/** Рисунок на грани: 100 единиц на метр, u вправо, v вниз, начало — верхний левый угол грани. */
type Decal = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

class Box {
  colors = {} as Record<Face, string>;
  edge: string;
  decals: Partial<Record<Face, Decal>> = {};
  b = [0, 0, 0, 0, 0, 0];
  op = 0;
  constructor(color: string, edge = 'rgba(15,16,13,0.35)', topColor?: string) {
    const c = rgb(color);
    const tc = rgb(topColor ?? color);
    for (const f of FACES) {
      const lam = 0.62 + 0.38 * Math.max(0, dot(NORMAL[f], LIGHT));
      this.colors[f] = f === '+z' ? shadeCss(tc, Math.max(lam, 0.98)) : shadeCss(c, lam);
    }
    this.edge = edge;
  }
  set(x: number, y: number, z: number, dx: number, dy: number, dz: number, op = 1) {
    this.b = [x, y, z, x + dx, y + dy, z + dz];
    this.op = dx > 0 && dy > 0 && dz > 0.03 ? op : 0;
    return this;
  }
  corners(f: Face): [V3, V3, V3, V3] {
    const [x0, y0, z0, x1, y1, z1] = this.b;
    switch (f) {
      case '+x':
        return [[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]];
      case '-x':
        return [[x0, y1, z1], [x0, y0, z1], [x0, y0, z0], [x0, y1, z0]];
      case '+y':
        return [[x1, y1, z1], [x0, y1, z1], [x0, y1, z0], [x1, y1, z0]];
      case '-y':
        return [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]];
      case '+z':
        return [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]];
      default:
        return [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]];
    }
  }
  center(): V3 {
    const b = this.b;
    return [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2];
  }
  draw(ctx: CanvasRenderingContext2D) {
    if (this.op <= 0.01) return;
    ctx.globalAlpha = this.op;
    for (const f of FACES) {
      const cs = this.corners(f);
      const mid: V3 = [(cs[0][0] + cs[2][0]) / 2, (cs[0][1] + cs[2][1]) / 2, (cs[0][2] + cs[2][2]) / 2];
      if (dot(NORMAL[f], sub(cam.pos, mid)) <= 0) continue;
      const p = cs.map(proj);
      if (p.some((q) => !q)) continue;
      const q = p as Pt[];
      ctx.beginPath();
      ctx.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
      ctx.closePath();
      ctx.fillStyle = this.colors[f];
      ctx.fill();
      ctx.strokeStyle = this.edge;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      const dec = this.decals[f];
      if (dec) {
        const w = Math.hypot(cs[1][0] - cs[0][0], cs[1][1] - cs[0][1], cs[1][2] - cs[0][2]) * 100;
        const h = Math.hypot(cs[3][0] - cs[0][0], cs[3][1] - cs[0][1], cs[3][2] - cs[0][2]) * 100;
        ctx.save();
        ctx.clip();
        ctx.transform((q[1][0] - q[0][0]) / w, (q[1][1] - q[0][1]) / w, (q[3][0] - q[0][0]) / h, (q[3][1] - q[0][1]) / h, q[0][0], q[0][1]);
        dec(ctx, w, h);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** Плоский рисунок на земле (подписи площадки): аффинно по трём точкам. */
function groundDecal(ctx: CanvasRenderingContext2D, o: V3, u: V3, v: V3, fn: () => void) {
  const p0 = proj(o);
  const pu = proj([o[0] + u[0], o[1] + u[1], o[2] + u[2]]);
  const pv = proj([o[0] + v[0], o[1] + v[1], o[2] + v[2]]);
  if (!p0 || !pu || !pv) return;
  ctx.save();
  ctx.transform((pu[0] - p0[0]) / 100, (pu[1] - p0[1]) / 100, (pv[0] - p0[0]) / 100, (pv[1] - p0[1]) / 100, p0[0], p0[1]);
  fn();
  ctx.restore();
}
function line3(ctx: CanvasRenderingContext2D, a: V3, b: V3) {
  const p = proj(a);
  const q = proj(b);
  if (!p || !q) return;
  ctx.moveTo(p[0], p[1]);
  ctx.lineTo(q[0], q[1]);
}
/** Выпуклая оболочка точек (для луча прожектора). */
function hull(pts: [number, number][]) {
  pts.sort((a, c) => a[0] - c[0] || a[1] - c[1]);
  const cz = (o: number[], a: number[], c: number[]) => (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  const lo: [number, number][] = [];
  for (const p of pts) {
    while (lo.length >= 2 && cz(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (up.length >= 2 && cz(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/* ---------- Сцена ---------- */
type Draw = { d: number; fn: () => void };

function build(root: HTMLElement) {
  const canvas = root.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const checks = [...root.querySelectorAll('[data-check]')] as SVGGElement[];
  const caps = [...root.querySelectorAll('[data-cap]')] as SVGGElement[];
  const ckFill = checks.map((c) => c.querySelector('[data-ck-fill]') as SVGElement);
  const ckTick = checks.map((c) => c.querySelector('[data-ck-tick]') as SVGElement);
  const ckLabel = checks.map((c) => c.querySelector('[data-ck-label]') as SVGElement);
  const L = root.dataset;
  let scale = 1;
  const F = 0.15; // высота подиума

  /* Камера: подлёт сверху, облёт, отлёт */
  const camDist = tr(42, [[3.0, 16.5], [16, 14], [20, 12.2], [27, 14.5], [32, 17], [36.6, 42]], SOFT);
  const camEl = tr(62, [[3.0, 31], [16, 27], [20, 15], [26.5, 21], [32, 32], [36.6, 62]], SOFT);
  // Выставку показываем спереди, за стены камера уходит быстро — на демонтаже.
  const camDev = tr(0, [[7, -13], [16, -44], [22, -48], [26, -44], [29, -6], [34, 14], [38.5, 0]], SOFT);

  /* Площадка, ящики, пол */
  const plotOn = tr(1, [[7.2, 0], [36.0, 1]], FAST);
  const crates: [number, number, number, number, number, number][] = [
    [2.6, 2.0, 0, 1.2, 1.0, 0.9],
    [4.0, 2.2, 0, 1.0, 1.0, 1.1],
    [3.1, 3.3, 0, 1.4, 1.0, 0.8],
    [2.8, 2.15, 0.9, 0.8, 0.7, 0.6],
  ];
  const crateBox = crates.map(() => new Box('#879152', 'rgba(15,16,13,0.45)', '#a3ad6c'));
  const crateSlide = crates.map((_, i) => tr(10, [[2.4 + i * 0.3, 0], [33.4 + i * 0.25, 10]], DROP));
  const crateVis = crates.map((_, i) => tr(0, [[2.4 + i * 0.3, 1], [7.0, 0], [31.0, 1], [35.6, 0]], FAST));
  const floor = new Box('#3d2542', 'rgba(193,144,200,0.6)');
  const floorIn = wn(7.0, 31.2);
  const floorDrop = tr(3, [[7.0, 0], [30.6, 3]], DROP);

  /* Стены, подсобка */
  const back = [0, 1, 2, 3].map(() => new Box('#ecece6', 'rgba(15,16,13,0.22)', '#ffffff'));
  const side = [0, 1, 2].map(() => new Box('#dedfd8', 'rgba(15,16,13,0.22)', '#ffffff'));
  const backH = back.map((_, i) => tr(0, [[7.8 + i * 0.3, 1], [29.6 - i * 0.15, 0]], DROP));
  const sideH = side.map((_, j) => tr(0, [[8.6 + j * 0.3, 1], [29.8 - j * 0.15, 0]], DROP));
  const storage = new Box('#e2e3dd', 'rgba(15,16,13,0.3)', '#f6f6f2');
  const storageH = tr(0, [[9.6, 1], [29.2, 0]], DROP);

  /* Печать на задней стене: одна картинка на четыре панели */
  let printP = 0;
  const printDecal =
    (i: number): Decal =>
    (c) => {
      if (printP <= 0.001) return;
      c.save();
      c.translate(-(8 - (i + 1) * 2) * 100, 15);
      c.beginPath();
      c.rect(0, 0, 600 * printP, 160);
      c.clip();
      c.fillStyle = '#59335f';
      c.fillRect(0, 0, 600, 160);
      c.strokeStyle = '#d2d8a8';
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(48, 160);
      c.lineTo(48, 70);
      c.arc(100, 70, 52, Math.PI, 0);
      c.lineTo(152, 160);
      c.stroke();
      c.fillStyle = '#d2d8a8';
      c.beginPath();
      c.moveTo(88, 160);
      c.lineTo(88, 96);
      c.arc(100, 96, 12, Math.PI, 0);
      c.lineTo(112, 160);
      c.fill();
      c.font = `600 92px ${SCRIPT}`;
      c.textAlign = 'left';
      c.fillText(L.script!, 190, 112);
      c.fillStyle = 'rgba(242,242,236,0.7)';
      c.beginPath();
      c.roundRect(196, 128, 220, 8, 4);
      c.fill();
      c.restore();
    };
  back.forEach((w, i) => (w.decals['+y'] = printDecal(i)));

  /* LED-экран на боковой стене (через две панели) */
  let ledVis = 0;
  let ledOn = 0;
  let ledAlt = 1;
  const ledDecal =
    (j: number): Decal =>
    (c) => {
      if (ledVis <= 0.01) return;
      c.save();
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * ledVis;
      c.translate((2.0 - j * 2) * 100, 55);
      c.fillStyle = '#0f100d';
      c.beginPath();
      c.roundRect(-6, -6, 312, 182, 4);
      c.fill();
      if (ledOn > 0.01) {
        c.globalAlpha = a0 * ledVis * ledOn;
        c.fillStyle = '#59335f';
        c.fillRect(0, 0, 300, 170);
        c.fillStyle = 'rgba(193,144,200,0.35)';
        for (let yy = 4; yy < 170; yy += 8) for (let xx = 4; xx < 300; xx += 8) c.fillRect(xx - 1, yy - 1, 2, 2);
        c.textAlign = 'center';
        c.globalAlpha = a0 * ledVis * ledOn * ledAlt;
        c.fillStyle = '#fff';
        c.font = `800 40px ${FONT}`;
        c.fillText('SIGNUP DXB', 150, 100);
        c.globalAlpha = a0 * ledVis * ledOn * (1 - ledAlt);
        c.fillStyle = '#d2d8a8';
        c.font = `600 64px ${SCRIPT}`;
        c.fillText(L.script!, 150, 112);
      }
      c.restore();
    };
  side.forEach((w, j) => (w.decals['+x'] = ledDecal(j)));
  const ledVisT = wn(9.4, 29.4, SNAP);
  const ledOnT = wn(13.6, 27.6);

  let doorOn = false;
  storage.decals['+x'] = (c) => {
    if (!doorOn) return;
    c.fillStyle = '#c9cbc2';
    c.strokeStyle = 'rgba(15,16,13,0.4)';
    c.lineWidth = 2;
    c.fillRect(30, 60, 80, 200);
    c.strokeRect(30, 60, 80, 200);
    c.fillStyle = '#59335f';
    c.beginPath();
    c.arc(96, 165, 4, 0, Math.PI * 2);
    c.fill();
  };

  /* Ферма и прожекторы */
  const TOP = 3.75;
  const cols = [
    [7.8, 0.05],
    [7.8, 5.75],
    [0.05, 5.75],
  ].map(([x, y]) => ({ x, y, b: new Box('#c9cbc2', 'rgba(15,16,13,0.4)') }));
  const laceDecal: Decal = (c, w) => {
    c.strokeStyle = '#8d9086';
    c.lineWidth = 2.4;
    c.beginPath();
    for (let i = 0; i * 20 <= w; i++) {
      if (i) c.lineTo(i * 20, i % 2 ? 20 : 2);
      else c.moveTo(0, 2);
    }
    c.stroke();
  };
  const beamSegs: Box[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new Box('#c9cbc2', 'rgba(15,16,13,0.4)');
    if (i < 4) b.decals['+y'] = b.decals['-y'] = laceDecal;
    else b.decals['+x'] = b.decals['-x'] = laceDecal;
    beamSegs.push(b);
  }
  const lamps = [
    [2, 5.86],
    [4, 5.86],
    [6, 5.86],
    [7.91, 2],
    [7.91, 4],
  ].map(([x, y]) => ({ x, y, b: new Box('#0f100d', 'rgba(255,255,255,0.3)', '#2a2b26') }));
  const colH = tr(0, [[10.2, 1], [28.8, 0]], DROP);
  const beamD = tr(3.5, [[10.8, 0], [28.5, 3.5]], DROP);
  const beamV = wn(10.8, 28.7);
  const lampV = lamps.map((_, i) => wn(11.4 + i * 0.15, 28.3, SNAP));
  const BEAMS = [
    [2, 5.86, 2.2, 4.4],
    [4, 5.86, 4.1, 3.6],
    [6, 5.86, 6.2, 4.8],
    [7.91, 2, 6.7, 1.7],
    [7.91, 4, 6.4, 3.4],
  ];
  const beamOn = BEAMS.map((_, i) => wn(18.2 + i * 0.15, 25.6));

  /* Баннер-кольцо на тросах */
  const BX = 2.6;
  const BY = 1.6;
  const BS = 2.8;
  const BH = 0.7;
  const bannerText: Decal = (c, w, h) => {
    c.fillStyle = '#fff';
    c.font = `800 40px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('SIGNUP DXB', w / 2, h / 2 + 14);
  };
  const ring = (['-y', '+y', '-x', '+x'] as Face[]).map((f) => {
    const b = new Box('#59335f', 'rgba(193,144,200,0.7)');
    b.decals[f] = bannerText;
    return b;
  });
  const bannerDrop = tr(5, [[14.0, 0], [27.4, 5]], DROP);
  const bannerV = wn(14.0, 27.8);

  /* Мебель */
  const counter = new Box('#59335f', 'rgba(193,144,200,0.6)', '#f2f2ec');
  let stripOn = 0;
  counter.decals['+y'] = (c, w) => {
    c.fillStyle = stripOn > 0.5 ? '#d2d8a8' : '#2a2b26';
    c.fillRect(0, 12, w, 26);
    c.fillStyle = stripOn > 0.5 ? '#0f100d' : '#4a4b45';
    c.font = `800 17px ${FONT}`;
    c.textAlign = 'center';
    c.fillText('SIGNUP DXB', w / 2, 31);
  };
  const counterH = tr(0, [[14.6, 1], [27.0, 0]], DROP);
  const stripT = wn(15.2, 26.8);
  const bar = new Box('#2a2b26', 'rgba(255,255,255,0.18)', '#f2f2ec');
  const machine = new Box('#59335f', 'rgba(255,255,255,0.25)', '#c190c8');
  const cups = [0, 1, 2].map(() => new Box('#d2d8a8', 'rgba(15,16,13,0.3)'));
  const barH = tr(0, [[15.0, 1], [26.9, 0]], DROP);
  const machineV = wn(15.4, 26.7, SNAP);
  const stools = [0, 1].map(() => ({ leg: new Box('#8d9086', 'rgba(0,0,0,0)'), seat: new Box('#d2d8a8', 'rgba(15,16,13,0.3)') }));
  const stoolH = stools.map((_, i) => tr(0, [[15.6 + i * 0.2, 1], [26.6, 0]], DROP));
  const chairs = [
    [1.6, 3.2],
    [2.4, 2.4],
    [3.2, 3.2],
  ].map(([x, y]) => ({ x, y, seat: new Box('#d2d8a8', 'rgba(15,16,13,0.3)'), back: new Box('#b7bd8c', 'rgba(15,16,13,0.3)') }));
  const chairH = chairs.map((_, i) => tr(0, [[16.0 + i * 0.2, 1], [26.3, 0]], DROP));
  const tLeg = new Box('#8d9086', 'rgba(0,0,0,0)');
  const tTop = new Box('#f2f2ec', 'rgba(15,16,13,0.3)', '#ffffff');
  const tableH = tr(0, [[15.8, 1], [26.4, 0]], DROP);
  const pods = [
    [6.4, 1.2, 0.9],
    [7.1, 2.1, 1.1],
    [6.3, 2.4, 0.7],
  ].map(([x, y, h]) => ({ x, y, h, base: new Box('#f2f2ec', 'rgba(15,16,13,0.3)', '#ffffff'), item: new Box('#c190c8', 'rgba(15,16,13,0.3)') }));
  const podH = pods.map((_, i) => tr(0, [[16.2 + i * 0.2, 1], [26.2, 0]], DROP));
  const podItem = pods.map((_, i) => wn(16.6 + i * 0.2, 26.0, SNAP));
  const plants = [
    [7.3, 0.3],
    [0.3, 5.3],
  ].map(([x, y]) => ({ x, y, pot: new Box('#f2f2ec', 'rgba(15,16,13,0.3)') }));
  const plantV = plants.map((_, i) => wn(16.8 + i * 0.2, 25.9, SNAP));
  const rollup = new Box('#f2f2ec', 'rgba(15,16,13,0.25)');
  rollup.decals['+y'] = (c, w, h) => {
    c.fillStyle = '#59335f';
    c.fillRect(0, 0, w, h * 0.38);
    c.strokeStyle = '#d2d8a8';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(w / 2 - 22, h * 0.38);
    c.lineTo(w / 2 - 22, h * 0.24);
    c.arc(w / 2, h * 0.24, 22, Math.PI, 0);
    c.lineTo(w / 2 + 22, h * 0.38);
    c.stroke();
    c.fillStyle = '#59335f';
    c.fillRect(12, h * 0.5, w - 24, 8);
    c.fillStyle = '#8d9086';
    c.fillRect(12, h * 0.6, w * 0.5, 6);
  };
  const rollBase = new Box('#8d9086', 'rgba(0,0,0,0)');
  const rollH = tr(0, [[17.0, 1], [25.8, 0]], DROP);

  /* Люди: персонал в сливовых пиджаках с бейджами и посетители */
  type Staff = { x: number; y: number; hx: number; hy: number; on: number; look: Look };
  const staff = (skin: number, hair: number, hairStyle: Look['hairStyle'], height: number): Look => ({ skin: SKIN[skin], hair: HAIR[hair], hairStyle, outfit: 'staff', top: '#59335f', bottom: '#1c1e1f', height });
  const STAFF: Staff[] = [
    { x: 6.2, y: 4.25, hx: 0, hy: 1, on: 17.6, look: staff(0, 1, 'long', 0.96) },
    { x: 1.0, y: 3.6, hx: 1, hy: 0.3, on: 17.8, look: staff(2, 2, 'short', 1.04) },
    { x: 3.9, y: 1.05, hx: 0, hy: 1, on: 18.0, look: staff(1, 0, 'bun', 0.95) },
    { x: 2.4, y: 3.95, hx: 0.4, hy: 1, on: 18.2, look: staff(3, 2, 'curly', 1.02) },
  ];
  const staffS = STAFF.map((s, i) => tr(0, [[s.on, 1], [25.6 + i * 0.1, 0]], SNAP));
  type Guest = { pts: [number, number][]; from: number; to: number; look: Look };
  const GUESTS: Guest[] = [
    { pts: [[-2, 7.3], [10, 7.3]], from: 18.2, to: 27.4, look: { skin: SKIN[4], hair: HAIR[3], hairStyle: 'short', outfit: 'suit', top: '#2b3550', bottom: '#2b3550', height: 1.03 } },
    { pts: [[10, 7.9], [-2, 7.9]], from: 18.8, to: 28.0, look: { skin: SKIN[1], hair: HAIR[0], hairStyle: 'short', outfit: 'kandura', top: '#f4f4ef', bottom: '#f4f4ef', beard: true, height: 1.05 } },
    { pts: [[9.5, 6.8], [6.8, 6.8], [6.4, 5.7], [6.4, 5.7], [6.4, 5.7]], from: 18.4, to: 26.4, look: { skin: SKIN[2], hair: HAIR[0], hairStyle: 'long', outfit: 'abaya', top: '#151515', bottom: '#151515', height: 0.95 } },
    { pts: [[-2, 6.9], [4.8, 6.9], [4.6, 4.9], [4.6, 4.9], [4.6, 4.9]], from: 19.0, to: 26.6, look: { skin: SKIN[0], hair: HAIR[4], hairStyle: 'long', outfit: 'dress', top: '#879152', bottom: '#879152', height: 0.97 } },
    { pts: [[10, 8.4], [-2, 8.4]], from: 19.6, to: 28.6, look: { skin: SKIN[3], hair: HAIR[2], hairStyle: 'curly', outfit: 'casual', top: '#c9cbc2', bottom: '#2b3550', height: 1.0 } },
  ];
  const at = (g: Guest, u: number): [number, number, number, number] => {
    const n = g.pts.length - 1;
    const f = clamp(u) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const r = f - i;
    const a = g.pts[i];
    const c = g.pts[i + 1];
    return [lerp(a[0], c[0], r), lerp(a[1], c[1], r), c[0] - a[0], c[1] - a[1]];
  };

  /* Чек-лист и подписи этапов */
  const ticks = [3.6, 11.4, 14.2, 16.0, 18.0].map((on, i) => tr(0, [[on, 1], [33.4 + i * 0.2, 0]], SNAP));
  const capVis = [tr(1, [[2.0, 0], [36.2, 1]], FAST), wn(2.2, 6.8), wn(7.0, 27.2), wn(27.4, 36.0)];
  // Когда всё отмечено и камера близко — чек-лист уходит, чтобы не спорить с баннером.
  const checksGroup = root.querySelector<SVGGElement>('.hs__checks'); // чек-листа на главной может не быть
  const checksVis = tr(1, [[19.6, 0], [32.6, 1]], SOFT);

  /* ---------- Кадр ---------- */
  function person(list: Draw[], x: number, y: number, z: number, hx: number, hy: number, look: Look, s: number, walk: number, t: number, seed: number, alpha: number) {
    if (s <= 0.02 || alpha <= 0.01) return;
    const foot = proj([x, y, z]);
    if (!foot) return;
    const front = hx * (cam.pos[0] - x) + hy * (cam.pos[1] - y) > 0;
    const px = (FOCAL * 1.75) / foot[2] / 100;
    list.push({ d: dist([x, y, z + 0.9]), fn: () => drawPerson(ctx, foot[0], foot[1], px * s, look, front, walk, t, seed, alpha) });
  }

  function seek(t: number) {
    t = wrap(t, LOOPT);
    const b = t / BEAT;
    setCam(-40 + (360 * b) / LB + camDev(t), camEl(t), camDist(t));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, 560, 560);
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1;

    /* --- Земля: сетка павильона, разметка, пол --- */
    const buckets: [number, Path2D][] = [0.05, 0.09, 0.13].map((a) => [a, new Path2D()]);
    for (let i = -6; i <= 14; i++)
      for (let j = -5; j <= 11; j++) {
        const dd = Math.hypot(i + 0.5 - 4, j - 3);
        const k = dd < 4.5 ? 2 : dd < 7 ? 1 : dd < 9.5 ? 0 : -1;
        if (k < 0) continue;
        const p = proj([i, j, 0]);
        const q = proj([i + 1, j, 0]);
        const r = proj([i, j + 1, 0]);
        if (!p || !q || !r) continue;
        buckets[k][1].moveTo(p[0], p[1]);
        buckets[k][1].lineTo(q[0], q[1]);
        buckets[k][1].moveTo(p[0], p[1]);
        buckets[k][1].lineTo(r[0], r[1]);
      }
    ctx.lineWidth = 1;
    for (const [a, path] of buckets) {
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.stroke(path);
    }

    const po = clamp(plotOn(t));
    if (po > 0.01) {
      ctx.globalAlpha = po;
      ctx.strokeStyle = '#d2d8a8';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      line3(ctx, [0, 0, 0], [8, 0, 0]);
      line3(ctx, [8, 0, 0], [8, 6, 0]);
      line3(ctx, [8, 6, 0], [0, 6, 0]);
      line3(ctx, [0, 6, 0], [0, 0, 0]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      line3(ctx, [0, 6.7, 0], [8, 6.7, 0]);
      line3(ctx, [0, 6.5, 0], [0, 6.9, 0]);
      line3(ctx, [8, 6.5, 0], [8, 6.9, 0]);
      line3(ctx, [8.7, 0, 0], [8.7, 6, 0]);
      line3(ctx, [8.5, 0, 0], [8.9, 0, 0]);
      line3(ctx, [8.5, 6, 0], [8.9, 6, 0]);
      ctx.stroke();
      ctx.fillStyle = '#d2d8a8';
      ctx.textAlign = 'center';
      groundDecal(ctx, [4, 7.5, 0], [1, 0, 0], [0, -1, 0], () => {
        ctx.font = `700 44px ${FONT}`;
        ctx.fillText(L.w!, 0, 0);
      });
      groundDecal(ctx, [9.5, 3, 0], [0, 1, 0], [1, 0, 0], () => {
        ctx.font = `700 44px ${FONT}`;
        ctx.fillText(L.d!, 0, 0);
      });
      groundDecal(ctx, [4, 3, 0], [1, 0, 0], [0, -1, 0], () => {
        ctx.font = `800 96px ${FONT}`;
        ctx.fillText(L.area!, 0, 34);
      });
      ctx.globalAlpha = 1;
    }

    const fv = clamp(floorIn(t));
    const fz = floorDrop(t);
    floor.set(0, 0, fz, 8, 6, F, fv).draw(ctx);
    if (fv > 0.01) {
      ctx.globalAlpha = fv;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 8; i++) line3(ctx, [i, 0, fz + F], [i, 6, fz + F]);
      for (let j = 1; j < 6; j++) line3(ctx, [0, j, fz + F], [8, j, fz + F]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* Пятна света на полу */
    const pools: { ring: Pt[]; o: number; lamp: Pt | null }[] = [];
    BEAMS.forEach(([lx, ly, fx, fy], i) => {
      const o = clamp(beamOn[i](t));
      if (o < 0.01) return;
      const ringPts: Pt[] = [];
      for (let a = 0; a < 16; a++) {
        const p = proj([fx + 0.75 * Math.cos((a / 16) * Math.PI * 2), fy + 0.75 * Math.sin((a / 16) * Math.PI * 2), F + 0.01]);
        if (p) ringPts.push(p);
      }
      if (ringPts.length < 16) return;
      ctx.fillStyle = `rgba(242,242,236,${(0.14 * o).toFixed(3)})`;
      ctx.beginPath();
      ringPts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
      pools.push({ ring: ringPts, o, lamp: proj([lx, ly, 3.5]) });
    });

    /* --- Предметы: от дальних к ближним --- */
    const list: Draw[] = [];
    const add = (bx: Box) => {
      if (bx.op > 0.01) list.push({ d: dist(bx.center()), fn: () => bx.draw(ctx) });
    };

    crates.forEach((c, i) => {
      const s = crateSlide[i](t);
      add(crateBox[i].set(c[0] + s * 0.25, c[1] + s, c[2], c[3], c[4], c[5], clamp(crateVis[i](t))));
    });

    back.forEach((w, i) => add(w.set(i * 2, -0.14, F, 2, 0.14, 3.0 * Math.max(0, backH[i](t)))));
    side.forEach((w, j) => add(w.set(-0.14, j * 2, F, 0.14, 2, 3.0 * Math.max(0, sideH[j](t)))));
    printP = clamp(b < 20 ? ease((b - 12.0) / 1.6) : 1 - ease((b - 28.0) / 0.8));
    ledVis = clamp(ledVisT(t));
    ledOn = clamp(ledOnT(t));
    ledAlt = clamp(0.5 + 1.6 * Math.cos((Math.PI * (b - 13.6)) / 2.5));
    const sh = 2.6 * Math.max(0, storageH(t));
    doorOn = sh > 2.3;
    add(storage.set(0, 0, F, 1.8, 1.5, sh));

    const ch = TOP * Math.max(0, colH(t));
    cols.forEach((c) => add(c.b.set(c.x, c.y, 0, 0.22, 0.22, ch)));
    const bz = TOP + beamD(t);
    const bv = clamp(beamV(t));
    for (let i = 0; i < 4; i++) add(beamSegs[i].set(0.05 + i * 2, 5.75, bz, i === 3 ? 1.97 : 2, 0.22, 0.22, bv));
    for (let i = 0; i < 3; i++) add(beamSegs[4 + i].set(7.8, 0.05 + i * 2, bz, 0.22, i === 2 ? 1.7 : 2, 0.22, bv));
    lamps.forEach((l, i) => add(l.b.set(l.x - 0.12, l.y - 0.12, bz - 0.3, 0.24, 0.24, 0.3, clamp(lampV[i](t)) * bv)));

    const rz = 4.7 + bannerDrop(t);
    const rv = clamp(bannerV(t));
    add(ring[0].set(BX, BY, rz, BS, 0.05, BH, rv));
    add(ring[1].set(BX, BY + BS - 0.05, rz, BS, 0.05, BH, rv));
    add(ring[2].set(BX, BY, rz, 0.05, BS, BH, rv));
    add(ring[3].set(BX + BS - 0.05, BY, rz, 0.05, BS, BH, rv));
    if (rv > 0.01) {
      for (const [x, y] of [
        [BX, BY],
        [BX + BS, BY],
        [BX + BS, BY + BS],
        [BX, BY + BS],
      ])
        list.push({
          d: dist([x, y, rz + 3]),
          fn: () => {
            ctx.globalAlpha = rv;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            line3(ctx, [x, y, rz + BH], [x, y, rz + BH + 7]);
            ctx.stroke();
            ctx.globalAlpha = 1;
          },
        });
    }

    const chh = 1.05 * Math.max(0, counterH(t));
    stripOn = clamp(stripT(t));
    add(counter.set(5.3, 4.6, F, 1.8, 0.7, chh));
    const bh = 1.05 * Math.max(0, barH(t));
    add(bar.set(2.6, 0.25, F, 2.4, 0.65, bh));
    const mv = Math.max(0, machineV(t));
    add(machine.set(2.8, 0.35, F + bh, 0.45, 0.4, 0.5 * mv, clamp(mv)));
    cups.forEach((c, i) => add(c.set(3.6 + i * 0.3, 0.6, F + bh, 0.12, 0.12, 0.14 * mv, clamp(mv))));
    stools.forEach((s, i) => {
      const v = Math.max(0, stoolH[i](t));
      const x = 3.2 + i * 1.1;
      add(s.leg.set(x + 0.15, 1.35, F, 0.1, 0.1, 0.7 * v, clamp(v)));
      add(s.seat.set(x, 1.2, F + 0.7 * v, 0.4, 0.4, 0.1 * v, clamp(v)));
    });
    const tv = Math.max(0, tableH(t));
    add(tLeg.set(2.35, 3.35, F, 0.12, 0.12, 0.72 * tv, clamp(tv)));
    add(tTop.set(1.95, 2.95, F + 0.72 * tv, 0.9, 0.9, 0.05 * tv, clamp(tv)));
    chairs.forEach((c, i) => {
      const v = Math.max(0, chairH[i](t));
      add(c.seat.set(c.x, c.y, F, 0.42, 0.42, 0.45 * v, clamp(v)));
      add(c.back.set(c.x, c.y, F + 0.45 * v, 0.42, 0.08, 0.4 * v, clamp(v)));
    });
    pods.forEach((p, i) => {
      const v = Math.max(0, podH[i](t));
      add(p.base.set(p.x, p.y, F, 0.55, 0.55, p.h * v, clamp(v)));
      const iv = Math.max(0, podItem[i](t));
      add(p.item.set(p.x + 0.15, p.y + 0.15, F + p.h * v, 0.25, 0.25, 0.3 * iv, clamp(iv)));
    });
    plants.forEach((p, i) => {
      const v = Math.max(0, plantV[i](t));
      add(p.pot.set(p.x, p.y, F, 0.4, 0.4, 0.45 * v, clamp(v)));
      if (v <= 0.02) return;
      const c = proj([p.x + 0.2, p.y + 0.2, F + 0.45 * v]);
      if (!c) return;
      const rpx = (FOCAL * 0.32 * v) / c[2];
      list.push({
        d: dist([p.x + 0.2, p.y + 0.2, F + 0.8]) - 0.01,
        fn: () => {
          ctx.globalAlpha = clamp(v);
          for (const [ox, oy, rr, col] of [
            [0, -0.9, 1, '#66712f'],
            [-0.6, -1.6, 0.75, '#879152'],
            [0.6, -1.7, 0.7, '#a3ad6c'],
          ] as [number, number, number, string][]) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(c[0] + ox * rpx, c[1] + oy * rpx, rr * rpx, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        },
      });
    });
    const rh = Math.max(0, rollH(t));
    add(rollBase.set(0.3, 5.35, F, 0.85, 0.12, 0.06, clamp(rh * 3)));
    add(rollup.set(0.3, 5.4, F + 0.06, 0.85, 0.03, 1.9 * clamp(rh, 0, 1.1)));

    STAFF.forEach((s, i) => {
      const v = Math.max(0, staffS[i](t));
      person(list, s.x, s.y, F, s.hx, s.hy, s.look, v, 0, t, i, clamp(v * 2));
    });
    GUESTS.forEach((g, i) => {
      const u = (b - g.from) / (g.to - g.from);
      if (u <= 0 || u >= 1) return;
      const [x, y, dx, dy] = at(g, u);
      const moving = Math.hypot(dx, dy) > 0.01;
      const onStand = y < 6 && x > 0 && x < 8;
      person(list, x, y, onStand ? F : 0, moving ? dx : 0, moving ? dy : 1, g.look, 1, moving ? t * Math.PI * 3.4 + i : 0, t, 10 + i, clamp(Math.min(u, 1 - u) * 12));
    });

    list.sort((a, c) => c.d - a.d);
    for (const it of list) it.fn();

    /* --- Лучи прожекторов поверх, полупрозрачно --- */
    for (const pl of pools) {
      if (!pl.lamp) continue;
      const h = hull([[pl.lamp[0], pl.lamp[1]], ...pl.ring.map((p) => [p[0], p[1]] as [number, number])]);
      const cx = pl.ring.reduce((s, p) => s + p[0], 0) / pl.ring.length;
      const cy = pl.ring.reduce((s, p) => s + p[1], 0) / pl.ring.length;
      const g = ctx.createLinearGradient(pl.lamp[0], pl.lamp[1], cx, cy);
      g.addColorStop(0, `rgba(242,242,236,${(0.3 * pl.o).toFixed(3)})`);
      g.addColorStop(1, 'rgba(242,242,236,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      h.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
    }

    /* --- Чек-лист и этапы (SVG поверх холста) --- */
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    scale = width / 560;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * dpr);
  }

  return { seek, fit };
}

/** Запасной вариант без WebGL: тот же стенд, нарисованный на Canvas 2D. */
export function createStand2D(root: HTMLElement) {
  const scene = build(root);
  // Надписи на гранях рисуются шрифтами сайта: когда они загрузятся, перерисуем спокойный кадр.
  document.fonts?.ready.then(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) scene.seek(STILL);
  });
  return scene;
}
