/**
 * Движение на сайте. Пять мест, одна грамматика — «выход на сцену»:
 * мягкое замедление cubic-bezier(0.16, 1, 0.3, 1), ничего не прыгает.
 *
 * 1. Первый экран: колода фото работ медленно перетасовывается.
 * 2. Карточки услуг: появляются по очереди, фото следует за курсором.
 * 3. Схема работы: линия прорисовывается по прокрутке, этапы загораются.
 * 4. Карусель работ: стрелки, свайп, соседние кадры приглушены.
 * 5. Цифры: считают от нуля, когда полоса попадает в экран.
 *
 * Контент виден без скрипта. Класс js-motion ставится в <head> и снимается
 * через 2,5 с, если этот модуль так и не запустился.
 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}
window.__motionReady = true;

/* ---------- Появление при прокрутке ---------- */
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

/* ---------- 5. Счётчики ---------- */
const countIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      countIO.unobserve(el);
      const to = Number(el.dataset.count);
      if (reduce || !Number.isFinite(to)) continue;
      const start = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = String(Math.round(to * ease(p)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    }
  },
  { threshold: 0.6 },
);
document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

/* ---------- 3. Схема работы ---------- */
document.querySelectorAll<HTMLElement>('[data-process]').forEach((root) => {
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    // Линия доходит до точки, которая сейчас на 60% высоты экрана.
    const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
    root.style.setProperty('--p', p.toFixed(4));
    for (const s of steps) {
      const dot = s.querySelector<HTMLElement>('[data-dot]') ?? s;
      const d = dot.getBoundingClientRect();
      s.classList.toggle('is-lit', d.top + d.height / 2 < vh * 0.6);
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  if (reduce) {
    root.style.setProperty('--p', '1');
    steps.forEach((s) => s.classList.add('is-lit'));
    return;
  }
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else window.removeEventListener('scroll', onScroll);
    }
  }).observe(root);
});

/* ---------- 4. Карусель работ ---------- */
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const slides = [...track.querySelectorAll<HTMLElement>('[data-slide]')];
  const counter = root.querySelector<HTMLElement>('[data-counter]');
  let active = 0;

  const setActive = (i: number) => {
    active = i;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (counter) counter.textContent = `${i + 1} / ${slides.length}`;
  };
  const go = (i: number) => {
    const n = (i + slides.length) % slides.length;
    const s = slides[n];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  };

  // Активный кадр — тот, что ближе всего к центру дорожки.
  let raf = 0;
  const pick = () => {
    raf = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    slides.forEach((s, k) => {
      const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
      if (d < dist) {
        dist = d;
        best = k;
      }
    });
    if (best !== active) setActive(best);
  };
  track.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(pick);
  }, { passive: true });

  root.querySelector('[data-prev]')?.addEventListener('click', () => go(active - 1));
  root.querySelector('[data-next]')?.addEventListener('click', () => go(active + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  });
  slides.forEach((s, k) => s.addEventListener('click', (e) => {
    if (k !== active) { e.preventDefault(); go(k); }
  }));
  setActive(0);
  requestAnimationFrame(() => go(0));
});

/* ---------- 2. Фото карточек следует за курсором ---------- */
if (!reduce && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0');
      el.style.setProperty('--my', '0');
    });
  });
}

/* ---------- 1. Колода фото на первом экране ---------- */
document.querySelectorAll<HTMLElement>('[data-deck]').forEach((deck) => {
  if (reduce) return;
  const cards = [...deck.querySelectorAll<HTMLElement>('[data-card]')];
  if (cards.length < 2) return;
  let order = cards.map((_, i) => i);
  let timer = 0;
  const place = () => order.forEach((c, pos) => (cards[c].dataset.pos = String(pos)));
  const step = () => {
    const top = order[0];
    cards[top].classList.add('is-leaving');
    window.setTimeout(() => {
      cards[top].classList.remove('is-leaving');
      order = [...order.slice(1), top];
      place();
    }, 520);
  };
  const run = () => {
    if (!timer) timer = window.setInterval(step, 4200);
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };
  place();
  // Колода крутится, только пока видна и вкладка активна.
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? run() : stop()))).observe(deck);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
  deck.addEventListener('pointerenter', stop);
  deck.addEventListener('pointerleave', run);
});

export {};
