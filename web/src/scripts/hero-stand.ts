/**
 * Первый экран: стенд 48 м² в 3D.
 * Основной рендер — WebGL (three.js), грузится отдельным файлом, когда браузер
 * освободится после первой отрисовки; на телефоне — после первого действия человека.
 * Если WebGL недоступен или устройство слабое (экономия трафика, медленная сеть,
 * мало памяти) — тот же сценарий на Canvas 2D.
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
/**
 * Первое действие человека на странице: касание, нажатие, клавиша — сразу;
 * прокрутка — когда сцена при этом видна хотя бы наполовину.
 */
function firstInteraction(stage: HTMLElement) {
  return new Promise<void>((done) => {
    const INPUT = ['pointerdown', 'touchstart', 'keydown'] as const;
    const opts = { passive: true, capture: true } as const;
    let half = false;
    let scrolled = false;
    const io = new IntersectionObserver(
      (es) => {
        half = es.some((e) => e.intersectionRatio >= 0.5);
        if (half && scrolled) go();
      },
      { threshold: 0.5 },
    );
    const onScroll = () => {
      scrolled = true;
      if (half) go();
    };
    function go() {
      INPUT.forEach((t) => window.removeEventListener(t, go, opts));
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      done();
    }
    INPUT.forEach((t) => window.addEventListener(t, go, opts));
    // Прокрутка — только самой страницы: без capture, иначе сюда попадёт и прокрутка карусели.
    window.addEventListener('scroll', onScroll, { passive: true });
    io.observe(stage);
  });
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
  // На телефоне тяжёлую сцену (three.js, ~1 с работы процессора) не собираем при загрузке:
  // до первого действия человека на её месте стоит кадр стенда. Старт — по первому
  // касанию, нажатию или клавише, либо когда после прокрутки сцена видна хотя бы наполовину.
  const settled = () =>
    window.matchMedia('(max-width: 760px)').matches ? firstInteraction(root) : Promise.resolve();
  const engine = lowEnd()
    ? flat()
    : Promise.all([settled().then(idle).then(() => import('./stand3d')), atMost(fonts, FONT_WAIT)])
        .then(([m]) => m.createStand3D(root, canvas, fonts))
        .then((s) => (s ? mark(s, '3d') : flat()))
        .catch(flat);
  engine.then(start);
});

export {};
