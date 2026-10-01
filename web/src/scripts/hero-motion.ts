/**
 * Моушн первого экрана. Каждый кадр — чистая функция времени seek(t):
 * никаких CSS-переходов, таймеров и состояния между кадрами.
 *
 * Пружины — ответ на ступеньку в закрытой форме. Значение, у которого цель
 * меняется много раз, — сумма пружин по каждой смене. Смены прошлого круга
 * тоже учитываются, поэтому стык петли не виден: последний кадр равен первому.
 *
 * Ритм 120 ударов в минуту: 28 долей по 0,5 с, петля 14 с.
 */

type Spring = { f: number; z: number };
type Key = [beat: number, value: number];

const BEAT = 0.5;
const LOOP = 28 * BEAT;

const SNAP: Spring = { f: 2.3, z: 0.74 };
const SOFT: Spring = { f: 1.5, z: 0.86 };
const FAST: Spring = { f: 4.5, z: 1 };
const LEAD: Spring = { f: 3.6, z: 0.72 };
const TRAIL: Spring = { f: 1.8, z: 0.92 };
const HAND: Spring = { f: 2.1, z: 0.9 };
/** Цвет формы меняется быстро: серая каша между тёмным и светлым не читается. */
const TINT: Spring = { f: 3.4, z: 1 };

function unit(tau: number, s: Spring): number {
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * s.f;
  if (s.z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - s.z * s.z);
  return 1 - Math.exp(-s.z * w * tau) * (Math.cos(wd * tau) + ((s.z * w) / wd) * Math.sin(wd * tau));
}

/** Трек: стартовое значение и смены цели по долям. Последняя цель = стартовой. */
function track(v0: number, keys: Key[], s: Spring) {
  let prev = v0;
  const deltas = keys.map(([b, v]) => {
    const d: [number, number] = [b * BEAT, v - prev];
    prev = v;
    return d;
  });
  return (t: number) => {
    let v = v0;
    for (const [ts, d] of deltas) v += d * (unit(t - ts, s) + unit(t - ts + LOOP, s));
    return v;
  };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
const easeIO = (p: number) => {
  p = clamp(p);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};

/* ---------- Состояния формы ---------- */

type State = { w: number; h: number; r: number; c: [number, number, number]; edge: number };
const PLUM: [number, number, number] = [89, 51, 95];
const OLIVE: [number, number, number] = [210, 216, 168];
const PAPER: [number, number, number] = [242, 242, 236];
const NIGHT: [number, number, number] = [8, 9, 7];
const DARK: [number, number, number] = [26, 27, 23];

const S: Record<string, State> = {
  btn: { w: 280, h: 64, r: 32, c: PLUM, edge: 0 },
  load: { w: 64, h: 64, r: 32, c: PLUM, edge: 0 },
  check: { w: 64, h: 64, r: 32, c: OLIVE, edge: 0 },
  island: { w: 340, h: 60, r: 30, c: NIGHT, edge: 0.16 },
  budget: { w: 340, h: 184, r: 28, c: PAPER, edge: 0 },
  toggles: { w: 340, h: 240, r: 28, c: PAPER, edge: 0 },
  tabs: { w: 340, h: 56, r: 28, c: DARK, edge: 0.16 },
  chart: { w: 360, h: 240, r: 28, c: PAPER, edge: 0 },
  cmd: { w: 360, h: 60, r: 30, c: DARK, edge: 0.16 },
  res: { w: 360, h: 228, r: 26, c: DARK, edge: 0.16 },
  photo: { w: 280, h: 336, r: 8, c: PAPER, edge: 0 },
};

/** Когда форма становится чем (в долях). */
const PLAN: [number, keyof typeof S][] = [
  [1.8, 'load'],
  [5.0, 'check'],
  [6.3, 'island'],
  [8.3, 'budget'],
  [12.4, 'toggles'],
  [15.8, 'tabs'],
  [18.6, 'chart'],
  [21.9, 'cmd'],
  [23.6, 'res'],
  [24.8, 'photo'],
  [26.5, 'btn'],
];

/** Тумблеры щёлкают в такт: на каждой половине доли, чуть после нажатия. */
const FLIPS = [13.05, 13.55, 14.05, 14.55];
/** Кадр для «уменьшить движение» и до запуска скрипта: все блоки включены. */
const STILL = 15.6 * BEAT;

function build(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const $$ = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll(sel)] as T[];

  const canvas = $<HTMLElement>('.hm__canvas');
  const cam = $<HTMLElement>('[data-cam]');
  const shape = $<HTMLElement>('[data-shape]');
  const cursor = $<SVGElement>('[data-cursor]');
  const layers = Object.fromEntries($$<HTMLElement>('[data-l]').map((el) => [el.dataset.l!, el]));
  const spin = $<SVGElement>('[data-spin]');
  const tick = $<SVGElement>('[data-tick]');
  const pulse = $<HTMLElement>('[data-pulse]');
  const budgetVal = $<HTMLElement>('[data-budget-val]');
  const trackEl = $<HTMLElement>('[data-track]');
  const fill = $<HTMLElement>('[data-fill]');
  const knob = $<HTMLElement>('[data-knob]');
  const switches = $$<HTMLElement>('[data-sw]');
  const swKnobs = $$<HTMLElement>('[data-sw-knob]');
  const ind = $<HTMLElement>('[data-ind]');
  const tabs = $$<HTMLElement>('[data-tab]');
  const line = $<SVGElement>('[data-line]');
  const dots = $$<SVGElement>('[data-dot]');
  const tip = $<HTMLElement>('[data-tip]');
  const typed = $<HTMLElement>('[data-typed]');
  const caret = $<HTMLElement>('[data-caret]');
  const ph = $<HTMLElement>('[data-ph]');
  const rows = $$<HTMLElement>('[data-res-row]');
  const enter = $<HTMLElement>('[data-enter]');
  const budgets: string[] = JSON.parse(root.dataset.budgets || '[]');
  const query = root.dataset.query || '';

  let fillW = 0.62;
  let fillH = 0.6;
  let capCam = 2.2;

  /* Треки пересобираются при смене ширины (на телефоне камера ближе). */
  let F: ReturnType<typeof makeTracks>;

  function makeTracks() {
    const camOf = (k: keyof typeof S) => Math.min((560 * fillW) / S[k].w, (560 * fillH) / S[k].h, capCam);
    const keysOf = (pick: (s: State) => number): Key[] => PLAN.map(([b, k]) => [b, pick(S[k])]);
    const start = S.btn;

    // Видимость слоёв: появляется чуть после смены формы, уходит в момент следующей.
    const vis: Record<string, (t: number) => number> = {};
    PLAN.forEach(([b, k], i) => {
      const next = PLAN[(i + 1) % PLAN.length][0];
      if (k === 'btn') vis.btn = track(1, [[1.8, 0], [b + 0.1, 1]], FAST);
      else vis[k] = track(0, [[b + 0.1, 1], [next, 0]], FAST);
    });

    // Курсор: точки в координатах экрана сцены. Камера переводит точки карточек.
    const REST: [number, number] = [196, 186];
    const at = (k: keyof typeof S, x: number, y: number): [number, number] => [x * camOf(k), y * camOf(k)];
    const pts: [number, [number, number]][] = [
      [0.5, at('btn', 64, 12)],
      [2.3, [150, 128]],
      [8.5, at('budget', -108, 44)],
    ];
    // Перетаскивание ползунка: курсор идёт за край шкалы, плотные точки = ведение рукой.
    for (let b = 9.6; b <= 11.41; b += 0.1) {
      const p = easeIO((b - 9.6) / 1.8);
      pts.push([b, at('budget', -108 + 300 * p, 44)]);
    }
    pts.push(
      [12.2, at('toggles', 124, -50)],
      [12.8, at('toggles', 124, -6)],
      [13.3, at('toggles', 124, 38)],
      [13.8, at('toggles', 124, 82)],
      [14.9, [150, 150]],
      [16.1, at('tabs', 0, 0)],
      [17.3, at('tabs', 110.67, 0)],
      [18.5, [150, 140]],
      [20.2, at('chart', 28, -2)],
      [21.9, [170, 150]],
      [26.6, REST],
    );
    const cx = track(REST[0], pts.map(([b, p]) => [b, p[0]]), HAND);
    const cy = track(REST[1], pts.map(([b, p]) => [b, p[1]]), HAND);
    const clicks = [1.4, 12.9, 13.4, 13.9, 14.4, 16.9, 18.0];
    const pressKeys: Key[] = [];
    clicks.forEach((b) => pressKeys.push([b, 1], [b + 0.3, 0]));
    pressKeys.push([9.3, 1], [11.6, 0]);
    pressKeys.sort((a, b) => a[0] - b[0]);
    const press = track(0, pressKeys, FAST);
    const cursorOn = track(0, [[0.2, 1], [26.9, 0]], FAST);

    const camT = track(camOf('btn'), PLAN.map(([b, k]) => [b, camOf(k)]), SOFT);

    return {
      camOf,
      w: track(start.w, keysOf((s) => s.w), SNAP),
      h: track(start.h, keysOf((s) => s.h), SNAP),
      r: track(start.r, keysOf((s) => s.r), SNAP),
      cr: track(start.c[0], keysOf((s) => s.c[0]), TINT),
      cg: track(start.c[1], keysOf((s) => s.c[1]), TINT),
      cb: track(start.c[2], keysOf((s) => s.c[2]), TINT),
      edge: track(start.edge, keysOf((s) => s.edge), SOFT),
      cam: camT,
      vis,
      cx,
      cy,
      press,
      cursorOn,
      tickDraw: track(0, [[5.15, 1], [6.6, 0]], SNAP),
      // Тумблеры: передняя кромка ручки быстрее задней — ручка тянется.
      swLead: FLIPS.map((b) => track(0, [[b, 1], [17, 0]], LEAD)),
      swTrail: FLIPS.map((b) => track(0, [[b, 1], [17, 0]], TRAIL)),
      // Вкладки: правая кромка индикатора ведёт, левая догоняет.
      indL: track(0, [[17.0, 1], [18.1, 2], [19.6, 0]], TRAIL),
      indR: track(0, [[17.0, 1], [18.1, 2], [19.6, 0]], LEAD),
      tipOn: track(0, [[21.0, 1], [21.9, 0]], FAST),
      hover: track(0, [[20.9, 1], [21.9, 0]], SNAP),
      enterP: track(0, [[24.4, 1], [24.65, 0]], FAST),
      rowOn: [0, 1, 2].map((i) => track(0, [[23.75 + 0.14 * i, 1], [25.4, 0]], SNAP)),
    };
  }

  // Отпускание ползунка: перетяг за край пружинит обратно.
  const DRAG_FROM = 9.3 * BEAT;
  const DRAG_TO = 11.6 * BEAT;
  const KNOB0 = 0.12;
  const budgetAt = (t: number) => {
    const camV = F.cam(t);
    const x = F.cx(Math.min(t, DRAG_TO)) / camV;
    const raw = (x + 142) / 284;
    return { p: clamp(raw), over: Math.max(0, x - 142) };
  };

  function seek(t: number, still = false) {
    t = ((t % LOOP) + LOOP) % LOOP;
    const b = t / BEAT;

    /* Камера и форма */
    const camV = F.cam(t);
    cam.style.transform = `scale(${camV.toFixed(4)})`;
    const edge = F.edge(t);
    shape.style.width = `${F.w(t).toFixed(2)}px`;
    shape.style.height = `${F.h(t).toFixed(2)}px`;
    shape.style.borderRadius = `${Math.max(0, F.r(t)).toFixed(2)}px`;
    shape.style.backgroundColor = `rgb(${F.cr(t) | 0} ${F.cg(t) | 0} ${F.cb(t) | 0})`;
    shape.style.boxShadow = `inset 0 0 0 1px rgb(255 255 255 / ${clamp(edge).toFixed(3)})`;

    /* Слои: каждый текст входит и уходит со своим временем, с лёгким размытием */
    for (const k in layers) {
      const v = clamp(F.vis[k](t));
      const el = layers[k];
      el.style.opacity = v.toFixed(3);
      el.style.filter = v > 0.98 ? 'none' : `blur(${((1 - v) * 6).toFixed(2)}px)`;
      el.style.scale = (0.94 + 0.06 * v).toFixed(4);
      el.style.visibility = v < 0.01 ? 'hidden' : 'visible';
    }

    /* Загрузка и галочка */
    spin.style.transform = `rotate(${(t * 520) % 360}deg)`;
    tick.style.strokeDashoffset = (1 - clamp(F.tickDraw(t))).toFixed(4);

    /* Один контакт: пульс точки */
    const ph1 = (t * 1.25) % 1;
    pulse.style.transform = `scale(${1 + ph1 * 1.6})`;
    pulse.style.opacity = (1 - ph1).toFixed(3);

    /* Бюджет: значение берётся из положения курсора, пока он зажат */
    let p = KNOB0;
    let over = 0;
    if (t >= DRAG_FROM && t <= DRAG_TO) ({ p, over } = budgetAt(t));
    else if (t > DRAG_TO && b < 13.5) {
      const rel = budgetAt(DRAG_TO);
      p = rel.p;
      over = rel.over * Math.max(-0.2, 1 - unit(t - DRAG_TO, SNAP));
    }
    const stretch = over * 0.35;
    trackEl.style.width = `${(284 + stretch).toFixed(2)}px`;
    fill.style.width = `${(p * 284 + stretch).toFixed(2)}px`;
    knob.style.left = `${(p * 284 + stretch).toFixed(2)}px`;
    budgetVal.textContent = budgets[Math.min(budgets.length - 1, Math.floor(p * budgets.length * 0.999))] ?? '';

    /* Тумблеры */
    switches.forEach((sw, i) => {
      const lead = F.swLead[i](t);
      const trail = F.swTrail[i](t);
      const left = 3 + 18 * clamp(trail, -0.1, 1.1);
      const right = 23 + 18 * clamp(lead, -0.1, 1.1);
      swKnobs[i].style.left = `${left.toFixed(2)}px`;
      swKnobs[i].style.width = `${Math.max(16, right - left).toFixed(2)}px`;
      const m = clamp(lead);
      sw.style.backgroundColor = `rgb(${201 + (89 - 201) * m | 0} ${203 + (51 - 203) * m | 0} ${194 + (95 - 194) * m | 0})`;
    });

    /* Вкладки */
    const TAB = 110.67;
    const l = 4 + TAB * F.indL(t);
    const r = 4 + TAB + TAB * F.indR(t);
    ind.style.left = `${l.toFixed(2)}px`;
    ind.style.width = `${Math.max(40, r - l).toFixed(2)}px`;
    const mid = (l + r) / 2;
    tabs.forEach((tb, i) => {
      const d = Math.abs(mid - (4 + TAB * i + TAB / 2)) / TAB;
      tb.style.opacity = (1 - 0.4 * clamp(d)).toFixed(3);
    });

    /* Схема рисует сама себя */
    const draw = ease((b - 19.2) / 1.8);
    line.style.strokeDashoffset = (1 - draw).toFixed(4);
    const hv = F.hover(t);
    dots.forEach((d, i) => {
      const on = clamp((draw - i / (dots.length - 1)) * 6 + 1);
      d.style.opacity = on.toFixed(3);
      d.style.transform = `scale(${(on * (i === 3 ? 1 + 0.45 * hv : 1)).toFixed(3)})`;
    });
    const tv = clamp(F.tipOn(t));
    tip.style.opacity = tv.toFixed(3);
    tip.style.transform = `translate(-50%, calc(-100% + ${((1 - tv) * 8).toFixed(2)}px))`;

    /* Поиск: печатаем по 1/4 доли, каретка мигает в такт */
    const n = [22.5, 22.75, 23.0, 23.25].filter((k) => b >= k).length;
    typed.textContent = query.slice(0, n);
    ph.style.display = n ? 'none' : '';
    caret.style.opacity = Math.floor(t * 2) % 2 ? '0' : '1';
    rows.forEach((row, i) => {
      const v = F.rowOn[i](t);
      row.style.opacity = clamp(v).toFixed(3);
      row.style.translate = `0 ${((1 - v) * 10).toFixed(2)}px`;
    });
    const ep = clamp(F.enterP(t));
    enter.style.scale = (1 - 0.12 * ep).toFixed(3);
    enter.style.borderColor = `rgb(210 216 168 / ${(0.18 + 0.8 * ep).toFixed(3)})`;
    enter.style.color = ep > 0.4 ? '#d2d8a8' : '';

    /* Курсор */
    const on = still ? 0 : clamp(F.cursorOn(t));
    const pr = clamp(F.press(t));
    cursor.style.opacity = on.toFixed(3);
    cursor.style.transform = `translate(${F.cx(t).toFixed(2)}px, ${F.cy(t).toFixed(2)}px) scale(${(1 - 0.16 * pr).toFixed(3)})`;
  }

  /* Размер сцены и камера под телефон */
  const fit = () => {
    const wpx = root.clientWidth;
    root.style.setProperty('--fit', (wpx / 560).toFixed(4));
    const narrow = wpx < 480;
    fillW = narrow ? 0.86 : 0.74;
    fillH = narrow ? 0.74 : 0.66;
    capCam = narrow ? 2.6 : 2.2;
    F = makeTracks();
  };
  fit();
  canvas.style.visibility = 'visible';

  return { seek, fit };
}

document.querySelectorAll<HTMLElement>('[data-hero-motion]').forEach((root) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = build(root);
  const btn = root.querySelector<HTMLButtonElement>('[data-hm-toggle]')!;
  // Для покадровой проверки в разработке: остановить и показать момент t.
  if (import.meta.env.DEV) (root as HTMLElement & { seekAt?: (t: number) => void }).seekAt = (t) => { stop(); userPaused = true; scene.seek(t); };

  let raf = 0;
  let base = 0; // время сцены, накопленное до последней паузы
  let since = 0; // когда запустили
  let visible = false;
  let userPaused = false;

  const now = () => base + (raf ? (performance.now() - since) / 1000 : 0);
  const frame = () => {
    scene.seek(base + (performance.now() - since) / 1000);
    raf = requestAnimationFrame(frame);
  };
  const play = () => {
    if (raf || userPaused || !visible || document.hidden || reduce.matches) return;
    since = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (!raf) return;
    base = now();
    cancelAnimationFrame(raf);
    raf = 0;
  };

  new ResizeObserver(() => {
    scene.fit();
    if (reduce.matches) scene.seek(STILL, true);
    else scene.seek(now());
  }).observe(root);

  new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    visible ? play() : stop();
  }).observe(root);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  btn.hidden = false;
  btn.addEventListener('click', () => {
    userPaused = !userPaused;
    root.toggleAttribute('data-paused', userPaused);
    btn.setAttribute('aria-label', userPaused ? btn.dataset.labelPlay! : btn.dataset.labelPause!);
    userPaused ? stop() : play();
  });

  const applyReduce = () => {
    if (reduce.matches) {
      stop();
      btn.hidden = true;
      scene.seek(STILL, true);
    } else {
      btn.hidden = false;
      play();
    }
  };
  reduce.addEventListener('change', applyReduce);
  applyReduce();
  if (!reduce.matches) scene.seek(0);
});

export {};
