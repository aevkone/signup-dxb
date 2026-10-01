/**
 * Первый экран: стенд 48 м² в 3D.
 * Основной рендер — WebGL (three.js), грузится отдельным файлом после страницы.
 * Если WebGL недоступен — тот же сценарий на Canvas 2D.
 */
import { playScene } from './hero-player';
import type { Scene } from './hero-player';

const STILL = 22 * 0.5;

document.querySelectorAll<HTMLElement>('[data-hero-stand]').forEach((root) => {
  const canvas = root.querySelector('canvas') as HTMLCanvasElement;
  let impl: Scene | null = null;
  let lastT = 0;
  let lastStill = false;
  let lastW = root.clientWidth;
  // Пока движок грузится, проигрыватель уже идёт: запоминаем время и размер.
  const proxy: Scene = {
    seek(t, still) {
      lastT = t;
      lastStill = still;
      impl?.seek(t, still);
    },
    fit(w) {
      lastW = w;
      impl?.fit?.(w);
    },
  };
  playScene(root, proxy, STILL);

  const start = (s: Scene) => {
    impl = s;
    s.fit?.(lastW);
    s.seek(lastStill ? STILL : lastT, lastStill);
    root.classList.add('is-ready');
  };
  import('./stand3d')
    .then((m) => m.createStand3D(root, canvas))
    .then((s) => s ?? import('./stand2d').then((m) => m.createStand2D(root)))
    .catch(() => import('./stand2d').then((m) => m.createStand2D(root)))
    .then(start);
});

export {};
