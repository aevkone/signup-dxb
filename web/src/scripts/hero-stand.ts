/**
 * Первый экран: стенд 48 м² в 3D.
 * Основной рендер — WebGL (three.js), грузится отдельным файлом, когда браузер
 * освободится после первой отрисовки. Если WebGL недоступен или устройство
 * слабое (экономия трафика, медленная сеть, мало памяти) — тот же сценарий на Canvas 2D.
 */
import { playScene } from './hero-player';
import type { Scene } from './hero-player';

const STILL = 22 * 0.5;
const FONT_WAIT = 2500;

type NetInfo = { saveData?: boolean; effectiveType?: string };
type Nav = Navigator & { connection?: NetInfo; deviceMemory?: number };

/** Слабое устройство или дорогой трафик: three.js и тени не тянем. */
function lowEnd() {
  const nav = navigator as Nav;
  const net = nav.connection;
  if (net?.saveData) return true;
  if (net?.effectiveType && ['slow-2g', '2g', '3g'].includes(net.effectiveType)) return true;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return true;
  const cores = nav.hardwareConcurrency || 8;
  return cores <= 4 && window.matchMedia('(max-width: 599px)').matches;
}

/** Ждём, пока браузер освободится: тяжёлый модуль не должен мешать первой отрисовке. */
const idle = () =>
  new Promise<void>((done) => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => done(), { timeout: 1500 });
    else setTimeout(done, 600);
  });

/**
 * Шрифты текстур: Caveat на печати и Montserrat на баннере и стойке.
 * Холст сам их не дожидается и рисует запасным шрифтом, поэтому грузим заранее.
 * Текст нужен, чтобы подтянулись и кириллица, и латиница: шрифты разбиты по алфавитам.
 */
function loadFonts(script: string) {
  const fonts = document.fonts;
  if (!fonts?.load) return Promise.resolve();
  return Promise.all([
    fonts.load('600 190px Caveat', `${script} под ключ turnkey`),
    fonts.load('800 74px "Montserrat Variable"', 'SIGNUP DXB 48 м² 8 м'),
  ]).then(
    () => undefined,
    () => undefined,
  );
}
const atMost = (p: Promise<unknown>, ms: number) => Promise.race([p, new Promise((done) => setTimeout(done, ms))]);

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
  // Для проверки в разработке: какой движок рисует сцену.
  const mark = (s: Scene, kind: string) => {
    if (import.meta.env.DEV) root.dataset.engine = kind;
    return s;
  };
  const flat = () => import('./stand2d').then((m) => mark(m.createStand2D(root), '2d'));
  // Шрифты начинают грузиться сразу, а первый кадр ждёт их не дольше 2,5 с.
  // Если придут позже — сцена сама перерисует надписи.
  const fonts = loadFonts(root.dataset.script || '');
  const engine = lowEnd()
    ? flat()
    : Promise.all([idle().then(() => import('./stand3d')), atMost(fonts, FONT_WAIT)])
        .then(([m]) => m.createStand3D(root, canvas, fonts))
        .then((s) => (s ? mark(s, '3d') : flat()))
        .catch(flat);
  engine.then(start);
});

export {};
