/**
 * Проигрыватель сцены первого экрана: подгоняет холст 560×560 под ширину,
 * крутит seek(t) только пока сцена видна и вкладка активна, даёт паузу,
 * а при «уменьшить движение» показывает один спокойный кадр.
 */

export type Scene = {
  seek: (t: number, still: boolean) => void;
  /** Ширина сцены изменилась (px). */
  fit?: (width: number) => void;
};

export function playScene(root: HTMLElement, scene: Scene, stillAt: number) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const btn = root.querySelector<HTMLButtonElement>('[data-hm-toggle]');

  let raf = 0;
  let base = 0;
  let since = 0;
  let visible = false;
  let userPaused = false;

  const now = () => base + (raf ? (performance.now() - since) / 1000 : 0);
  // Не чаще 60 кадров в секунду: на экранах 120 Гц иначе сцена рисуется вдвое чаще нужного.
  let last = 0;
  const frame = (ts: number) => {
    raf = requestAnimationFrame(frame);
    if (ts - last < 15) return;
    last = ts;
    scene.seek(base + (performance.now() - since) / 1000, false);
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

  // Для покадровой проверки в разработке: остановить и показать момент t.
  if (import.meta.env.DEV)
    (root as HTMLElement & { seekAt?: (t: number) => void }).seekAt = (t) => {
      stop();
      userPaused = true;
      base = t;
      scene.seek(t, false);
    };

  new ResizeObserver(() => {
    root.style.setProperty('--fit', (root.clientWidth / 560).toFixed(4));
    scene.fit?.(root.clientWidth);
    scene.seek(reduce.matches ? stillAt : now(), reduce.matches);
  }).observe(root);

  new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    visible ? play() : stop();
  }).observe(root);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  btn?.addEventListener('click', () => {
    userPaused = !userPaused;
    root.toggleAttribute('data-paused', userPaused);
    btn.setAttribute('aria-label', userPaused ? btn.dataset.labelPlay! : btn.dataset.labelPause!);
    userPaused ? stop() : play();
  });

  const applyReduce = () => {
    if (btn) btn.hidden = reduce.matches;
    if (reduce.matches) {
      stop();
      scene.seek(stillAt, true);
    } else play();
  };
  reduce.addEventListener('change', applyReduce);
  applyReduce();
  if (!reduce.matches) scene.seek(0, false);
}
