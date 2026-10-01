/**
 * Вариант Б: ночной город, вывески загораются по одной, как настоящий свет —
 * неон мигает при включении. Машины на набережной, абра на воде и звёзды
 * движутся по кругу петли, поэтому стык не виден. В финале город гаснет.
 */
import { BEAT, LOOP, SNAP, SOFT, clamp, ease, lerp, neon, track, win, wrap } from './spring';
import { playScene } from './hero-player';

const mix = (a: number[], b: number[], p: number) => `rgb(${Math.round(lerp(a[0], b[0], p))} ${Math.round(lerp(a[1], b[1], p))} ${Math.round(lerp(a[2], b[2], p))})`;
const DIM = [44, 45, 40];
const TAU = Math.PI * 2;

/** Когда что загорается и гаснет (доли). Гаснут в обратном порядке. */
const ON = { neon: 2.6, halo: 4.2, box: 5.8, led: 7.4, banner: 9.0, roof: 10.8, console: 13.0, arch: 15.4 };
const OFF = { arch: 23.4, console: 23.55, roof: 23.7, led: 24.0, box: 24.15, halo: 24.3, neon: 24.45 };
const LABEL_AT = [ON.neon, ON.halo + 0.2, ON.box + 0.2, ON.led + 0.2, ON.banner + 0.2, ON.roof + 0.4, ON.console + 0.2];

function build(root: HTMLElement) {
  const q = <T extends Element = SVGElement>(s: string) => root.querySelector(s) as T;
  const qa = <T extends Element = SVGElement>(s: string) => [...root.querySelectorAll(s)] as T[];

  const cam = q('[data-cam]');
  const far = q('[data-far]');
  const ripple = q('[data-ripple]');
  const windows = q('[data-windows]');
  const stars = qa('[data-stars] circle');
  const spill = qa('[data-spill]');
  const neonTube = q('[data-neon-tube]');
  const neonGlow = q('[data-neon-glow]');
  const halo = q('[data-halo]');
  const boxText = qa('[data-box-text]');
  const boxGlow = qa('[data-box-glow]');
  const led = q('[data-led]');
  const ledA = q('[data-led-a]');
  const ledB = q('[data-led-b]');
  const bannerClip = q('[data-banner-clip]');
  const roof = qa('[data-roof]');
  const roofGlow = qa('[data-roof-glow]');
  const consoleBox = q('[data-console]');
  const consoleGlow = q('[data-console-glow]');
  const consoleT = q('[data-console-t]');
  const arch = q('[data-arch]');
  const archGlow = q('[data-arch-glow]');
  const cars = qa('[data-car]');
  const boat = q('[data-boat]');
  const labels = qa('[data-label]');

  labels.forEach((l) => {
    const tx = l.querySelector('text') as SVGTextElement;
    (l.querySelector('[data-label-bg]') as SVGElement).setAttribute('width', String(Math.ceil(tx.getComputedTextLength() + 42)));
  });

  const labelVis = LABEL_AT.map((b) => win(b + 0.2, b + 2.6, SNAP));
  const winDim = track(1, [[24.5, 0.3], [26.8, 1]], SOFT);
  const zoom = track(1, [[15.4, 1.04], [24.0, 1]], SOFT);
  const STAR_N = stars.map((_, i) => 1 + (i % 4));
  const banner = (b: number) => (b < 20 ? ease((b - ON.banner) / 1.2) : 1 - ease((b - 25.4) / 0.9));

  function seek(t: number) {
    t = wrap(t);
    const b = t / BEAT;
    const ph = (TAU * t) / LOOP;

    /* Камера: плывёт по кругу, дальний слой — медленнее (глубина) */
    const pan = 9 * Math.sin(ph);
    const z = zoom(t) + 0.012 * Math.cos(ph) - 0.012;
    cam.setAttribute('transform', `translate(280 330) scale(${z.toFixed(4)}) translate(${(-280 + pan).toFixed(2)} -330)`);
    far.setAttribute('transform', `translate(${(-pan * 0.55).toFixed(2)} 0)`);
    ripple.setAttribute('patternTransform', `translate(0 ${((t * 9) % 6).toFixed(2)})`);
    windows.style.opacity = clamp(winDim(t), 0, 1).toFixed(3);
    stars.forEach((s, i) => (s.style.opacity = (0.2 + 0.45 * (0.5 + 0.5 * Math.sin(ph * STAR_N[i] + i * 1.7))).toFixed(3)));

    /* 1. Неон: трубка прорисовывается, потом включается с миганием */
    const draw = b < 1 ? 0 : ease((b - 1) / 1.6);
    const n1 = neon(t, ON.neon, OFF.neon);
    const tubeOff = b >= OFF.neon ? 1 - clamp((t - OFF.neon * BEAT) / 0.2) : 1;
    neonTube.style.strokeDashoffset = (1400 * (1 - draw)).toFixed(1);
    neonTube.style.opacity = ((draw > 0 ? 0.3 + 0.7 * n1 : 0) * tubeOff).toFixed(3);
    neonGlow.style.opacity = n1.toFixed(3);
    spill[0].setAttribute('opacity', (0.3 * n1).toFixed(3));

    /* 2. Контражур */
    const n2 = neon(t, ON.halo, OFF.halo);
    halo.style.opacity = (0.9 * n2).toFixed(3);
    spill[1].setAttribute('opacity', (0.22 * n2).toFixed(3));

    /* 3. Световые короба витрин */
    boxText.forEach((bt, i) => {
      const v = neon(t, ON.box + i * 0.3, OFF.box);
      bt.setAttribute('fill', mix(DIM, [242, 242, 236], v));
      boxGlow[i].style.opacity = (0.8 * v).toFixed(3);
    });

    /* 4. LED-экран: картинка меняется каждые две доли */
    const n4 = neon(t, ON.led, OFF.led);
    led.setAttribute('opacity', n4.toFixed(3));
    const alt = clamp(0.5 + 1.6 * Math.cos((Math.PI * (b - ON.led)) / 2));
    ledA.setAttribute('opacity', (n4 * alt).toFixed(3));
    ledB.setAttribute('opacity', (n4 * (1 - alt)).toFixed(3));
    spill[2].setAttribute('opacity', (0.28 * n4).toFixed(3));

    /* 5. Баннер разворачивается сверху вниз */
    bannerClip.setAttribute('height', (250 * clamp(banner(b))).toFixed(1));

    /* 6. Крышные буквы — по одной */
    let roofMax = 0;
    roof.forEach((r, i) => {
      const v = neon(t, ON.roof + i * 0.3, OFF.roof);
      roofMax = Math.max(roofMax, v);
      r.setAttribute('fill', mix(DIM, [251, 238, 252], v));
      roofGlow[i].setAttribute('fill-opacity', (0.8 * v).toFixed(3));
      roofGlow[i].setAttribute('stroke-opacity', (0.8 * v).toFixed(3));
    });
    spill[3].setAttribute('opacity', (0.22 * roofMax).toFixed(3));

    /* 7. Консоль */
    const n7 = neon(t, ON.console, OFF.console);
    consoleBox.setAttribute('fill', mix([26, 27, 23], [210, 216, 168], n7));
    consoleGlow.setAttribute('opacity', (0.6 * n7).toFixed(3));
    consoleT.setAttribute('fill', mix([74, 75, 69], [15, 16, 13], n7));

    /* 8. Неоновая арка: прорисовка контура и включение */
    const ad = b < 14.4 ? 0 : ease((b - 14.4) / 1.0);
    const n8 = neon(t, ON.arch, OFF.arch);
    arch.style.strokeDashoffset = (1 - ad).toFixed(4);
    arch.setAttribute('stroke', mix([58, 59, 54], [244, 247, 226], n8));
    arch.style.opacity = b >= OFF.arch + 0.5 ? '0' : '1';
    archGlow.setAttribute('opacity', (0.9 * n8).toFixed(3));
    spill[4].setAttribute('opacity', (0.25 * n8).toFixed(3));

    /* Набережная: фары по кругу, целое число кругов за петлю */
    cars.forEach((c, i) => {
      const dir = i % 2 ? 1 : -1;
      const n = 1 + (i % 3);
      const x = ((((i * 47 + dir * ((640 * n * t) / LOOP)) % 640) + 640) % 640) - 40;
      c.setAttribute('x', x.toFixed(1));
    });

    /* Абра: пересекает воду за одну петлю, покачивается */
    const bx = -80 + (720 * t) / LOOP;
    const by = 474 + Math.sin(ph * 6) * 1.2;
    boat.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(2)}) rotate(${(Math.sin(ph * 6 + 1) * 1.2).toFixed(2)})`);

    /* Подписи технологий: у каждой своё время входа и выхода */
    labels.forEach((l, i) => {
      const v = clamp(labelVis[i](t));
      l.style.display = v < 0.01 ? 'none' : '';
      l.style.opacity = v.toFixed(3);
      l.style.translate = `0 ${((1 - v) * 8).toFixed(2)}px`;
    });
  }

  return { seek };
}

document.querySelectorAll<HTMLElement>('[data-hero-neon]').forEach((root) => {
  // Спокойный кадр: все вывески горят.
  playScene(root, build(root), 20 * BEAT);
});

export {};
