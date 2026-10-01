/**
 * Общая математика сцен первого экрана: пружины в закрытой форме и треки,
 * у которых значение — чистая функция времени. Петля 14 с, 120 ударов в минуту.
 */

export type Spring = { f: number; z: number };
export type Key = [beat: number, value: number];

export const BEAT = 0.5;
export const LOOP = 28 * BEAT;

export const SNAP: Spring = { f: 2.3, z: 0.74 };
export const SOFT: Spring = { f: 1.5, z: 0.86 };
export const FAST: Spring = { f: 4.5, z: 1 };
export const LEAD: Spring = { f: 3.6, z: 0.72 };
export const TRAIL: Spring = { f: 1.8, z: 0.92 };
export const DROP: Spring = { f: 1.9, z: 0.62 };

/** Ответ пружины на ступеньку: 0 до момента смены, дальше к 1 с лёгким перелётом. */
export function unit(tau: number, s: Spring): number {
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * s.f;
  if (s.z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - s.z * s.z);
  return 1 - Math.exp(-s.z * w * tau) * (Math.cos(wd * tau) + ((s.z * w) / wd) * Math.sin(wd * tau));
}

/**
 * Трек: стартовое значение и смены цели по долям. Последняя цель должна
 * совпасть со стартовой — тогда смены прошлого круга досчитываются и стык петли не виден.
 */
export function track(v0: number, keys: Key[], s: Spring, loop = LOOP) {
  let prev = v0;
  const deltas = keys.map(([b, v]) => {
    const d: [number, number] = [b * BEAT, v - prev];
    prev = v;
    return d;
  });
  if (import.meta.env.DEV && Math.abs(prev - v0) > 1e-6) console.warn('track не замкнут в петлю', v0, keys);
  return (t: number) => {
    let v = v0;
    for (const [ts, d] of deltas) v += d * (unit(t - ts, s) + unit(t - ts + loop, s));
    return v;
  };
}

/** Окно видимости: включается в `on`, выключается в `off` (доли). */
export const win = (on: number, off: number, s: Spring = FAST, loop = LOOP) => track(0, [[on, 1], [off, 0]], s, loop);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
export const easeIO = (p: number) => {
  p = clamp(p);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};
/** Время внутри петли. */
export const wrap = (t: number, loop = LOOP) => ((t % loop) + loop) % loop;

/**
 * Включение настоящего неона: несколько миганий в первые 0,45 с, потом ровный свет.
 * Выключение — быстрое затухание. Всё — функция времени.
 */
const FLICK = [1, 0, 0.8, 0, 0, 1, 0.4, 1, 0, 1];
export function neon(t: number, onBeat: number, offBeat: number): number {
  const on = onBeat * BEAT;
  const off = offBeat * BEAT;
  const tau = t - on;
  let v = 0;
  if (tau >= 0) v = tau < 0.45 ? FLICK[Math.floor(tau / 0.045)] ?? 1 : 1;
  if (t >= off) v *= 1 - clamp((t - off) / 0.18);
  return v;
}
