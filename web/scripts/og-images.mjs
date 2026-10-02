/**
 * Картинки для соцсетей (og:image) — своя у каждого раздела, RU и EN.
 * Запуск: npm run og → public/img/og/<раздел>-<язык>.jpg, 1200×630, JPEG ~82.
 *
 * Карточка в стиле сайта (DESIGN.md): тёмная сцена #0f100d, сливовое свечение
 * снизу, светлый логотип, заголовок Montserrat 800 с одним словом от руки
 * (Caveat, пастельная олива), строка «signupdxb.com» и настоящее фото работы
 * в бумажной рамке со скотчем.
 *
 * Текст рисует headless Chrome со шрифтами из node_modules (@fontsource):
 * sharp/librsvg на macOS не подхватывает свои шрифты — pango там ходит
 * в системные шрифты мимо fontconfig. Если Chrome не найден, карточки
 * собираются через SVG в sharp системным гротеском (с предупреждением).
 * Путь к браузеру можно задать явно: CHROME_PATH=/путь/к/chrome npm run og
 *
 * Тексты — заголовки самих страниц (src/views/*.astro, src/consts.ts),
 * новых обещаний здесь нет. Поменялся заголовок страницы — поправьте и тут.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const OUT = join(PUB, 'img', 'og');
const W = 1200;
const H = 630;
const QUALITY = 82;
const SITE = 'signupdxb.com';

const C = {
  stage: '#0f100d',
  onStage: '#f2f2ec',
  muted: '#b3b6ab',
  plum: '#59335f',
  olivePastel: '#d2d8a8',
  paper: '#f5f5f1',
};

/**
 * Кадр 3D-стенда из public/img/stand/ (снимки сцены с первого экрана):
 * stand-<n>-1600.webp — русские надписи, stand-en-<n>-1600.webp — английские.
 * Нет файла — вернётся null, и карточка возьмёт запасное фото.
 */
function standStill(n, lang) {
  const dir = join(PUB, 'img', 'stand');
  const names = lang === 'en' ? [`stand-en-${n}`, `stand-${n}`] : [`stand-${n}`];
  for (const base of names)
    for (const ext of ['-1600.webp', '-1600.jpg', '-800.jpg', '-800.webp'])
      if (existsSync(join(dir, base + ext))) return `img/stand/${base}${ext}`;
  return null;
}

/** Фото раздела: кадр стенда на нужном языке или запасное фото. */
const stand = (n, fallback) => (lang) => standStill(n, lang) ?? fallback;

/**
 * Разделы. title — части заголовка: { t } обычный текст, { s } слово от руки,
 * br: true — перенос перед частью. sub — строка под заголовком.
 * photo — путь от public/ или функция от языка. Работы — из src/data/works.ts
 * (featured); у главной, выставок и заявки — кадр 3D-стенда, без него —
 * консьерж-фото Дубая или работа.
 */
const CARDS = [
  {
    id: 'home',
    photo: stand(2, 'img/concierge-1200.jpg'),
    ru: { title: [{ t: 'Организуем участие в выставках в Дубае' }, { s: 'под ключ', br: true }], sub: 'Дубай · Абу-Даби · Шарджа · Аджман' },
    en: { title: [{ s: 'Turnkey' }, { t: 'exhibitions in Dubai', br: true }], sub: 'Dubai · Abu Dhabi · Sharjah · Ajman' },
  },
  {
    id: 'exhibitions',
    photo: stand(1, 'img/works/w43-1200.webp'),
    ru: { title: [{ t: 'Выставки' }, { s: 'под ключ' }], sub: 'Организация выставок под ключ в Дубае' },
    en: { title: [{ s: 'Turnkey' }, { t: 'exhibitions' }], sub: 'Turnkey exhibition services in Dubai' },
  },
  {
    id: 'production',
    photo: 'img/works/w27-1200.webp',
    ru: { title: [{ t: 'Наружная реклама и производство' }], sub: 'Производство наружной рекламы в Дубае' },
    en: { title: [{ t: 'Outdoor advertising & production' }], sub: 'Outdoor advertising production in Dubai' },
  },
  {
    id: 'prices',
    photo: 'img/works/w36-1200.webp',
    ru: { title: [{ t: 'Прайс' }], sub: 'Цены на наружную рекламу и стенды в Дубае' },
    en: { title: [{ t: 'Price list' }], sub: 'Outdoor advertising & stand prices in Dubai' },
  },
  {
    id: 'works',
    photo: 'img/works/w17-1200.webp',
    ru: { title: [{ t: 'Наши работы' }], sub: 'Вывески и наружная реклама в Дубае' },
    en: { title: [{ t: 'Our work' }], sub: 'Signage & outdoor advertising in Dubai' },
  },
  {
    id: 'technologies',
    photo: 'img/works/w24-1200.webp',
    ru: { title: [{ t: 'Материалы и технологии' }], sub: 'Вывески, буквы и выставочные конструкции' },
    en: { title: [{ t: 'Materials & technologies' }], sub: 'Signs, letters and exhibition structures' },
  },
  {
    id: 'contacts',
    photo: 'img/concierge-1200.jpg',
    ru: { title: [{ t: 'Контакты' }], sub: 'Dubai Design District, Дубай' },
    en: { title: [{ t: 'Contacts' }], sub: 'Dubai Design District, Dubai' },
  },
  {
    id: 'configurator',
    photo: stand(3, 'img/works/w12-1200.webp'),
    ru: { title: [{ t: 'Соберите заявку за минуту' }], sub: 'Смета на стенд или вывеску в Дубае' },
    en: { title: [{ t: 'Build your request in a minute' }], sub: 'Quick quote for a stand or sign in Dubai' },
  },
];

/* ---------- общие ресурсы ---------- */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dataUri = (buf, mime) => `data:${mime};base64,${buf.toString('base64')}`;
const nm = (...p) => join(ROOT, 'node_modules', ...p);

/** Логотип для тёмного фона в лучшем доступном разрешении. */
const LOGO_FILE = ['img/logo-dark-bg.png', 'img/logo-light-320.png'].map((f) => join(PUB, f)).find(existsSync);
const logoPng = await sharp(LOGO_FILE).resize({ width: 260 }).png().toBuffer();

/**
 * Фото в рамке. Портретные кадры работ — 4:5, широкие кадры стенда — 4:3;
 * готовим вдвое крупнее для чёткости. copy — ширина колонки текста рядом.
 */
const FRAME = {
  tall: { w: 372, h: 430, left: 752, top: 62, copy: 640 },
  wide: { w: 420, h: 315, left: 724, top: 118, copy: 590 },
};
const photoCache = new Map();
async function photo(rel) {
  if (!photoCache.has(rel)) {
    const file = join(PUB, rel);
    const { width = 1, height = 1 } = await sharp(file).metadata();
    const f = width / height > 1.2 ? FRAME.wide : FRAME.tall;
    const buf = await sharp(file)
      .resize(f.w * 2, f.h * 2, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    photoCache.set(rel, { buf, f });
  }
  return photoCache.get(rel);
}

/* ---------- отрисовка через Chrome ---------- */

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
}

function fontFaces() {
  const mont = (sub) => nm('@fontsource-variable', 'montserrat', 'files', `montserrat-${sub}-wght-normal.woff2`);
  const cav = (sub) => nm('@fontsource', 'caveat', 'files', `caveat-${sub}-600-normal.woff2`);
  const face = (family, file, weight, range) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(${dataUri(readFileSync(file), 'font/woff2')}) format('woff2');unicode-range:${range}}`;
  const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215';
  const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
  return [
    face('Montserrat', mont('latin'), '100 900', LAT),
    face('Montserrat', mont('cyrillic'), '100 900', CYR),
    face('Caveat', cav('latin'), 600, LAT),
    face('Caveat', cav('cyrillic'), 600, CYR),
  ].join('\n');
}

/** Короткие предлоги и союзы не оставляем в конце строки — неразрывный пробел после них. */
const glue = (s) => esc(s).replace(/(^|\s)(в|во|и|с|со|к|на|о|об|у|за|по|от|до|из|a|an|&amp;|or|of|in|for)\s/giu, '$1$2 ');

function titleHtml(parts) {
  return parts
    .map((p, i) => {
      const sep = i === 0 ? '' : p.br ? '<br>' : ' ';
      return sep + (p.s ? `<span class="script">${esc(p.s)}</span>` : glue(p.t));
    })
    .join('');
}

function cardHtml(copy, pic, fonts) {
  const f = pic.f;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.stage}}
body{font-family:'Montserrat',sans-serif;color:${C.onStage};-webkit-font-smoothing:antialiased}
.card{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${C.stage}}
/* Сливовое свечение поднимается снизу, как в тёмных секциях сайта. */
.glow{position:absolute;inset:0;background:
  radial-gradient(70% 75% at 22% 118%, rgb(89 51 95 / .85), rgb(89 51 95 / .35) 45%, rgb(89 51 95 / 0) 72%),
  radial-gradient(45% 55% at 82% 112%, rgb(89 51 95 / .45), rgb(89 51 95 / 0) 70%)}
.logo{position:absolute;left:72px;top:46px;width:112px;height:auto}
.copy{position:absolute;left:72px;top:188px;width:${f.copy}px;height:310px;display:flex;flex-direction:column;justify-content:center}
h1{font-weight:800;font-size:68px;line-height:1.04;letter-spacing:-.035em;text-wrap:balance}
.script{font-family:'Caveat',cursive;font-weight:600;font-size:1.28em;line-height:.9;letter-spacing:0;color:${C.olivePastel}}
.sub{margin-top:22px;font-weight:500;font-size:25px;line-height:1.35;color:${C.muted};text-wrap:balance}
.site{position:absolute;left:72px;bottom:52px;display:flex;align-items:center;gap:14px;font-weight:700;font-size:22px;letter-spacing:-.005em}
.site i{display:block;width:12px;height:12px;border-radius:50%;background:${C.olivePastel}}
/* Фото в бумажной рамке со скотчем — как колода на первом экране сайта. */
.frame{position:absolute;left:${f.left}px;top:${f.top}px;width:${f.w + 24}px;padding:12px 12px 44px;background:${C.paper};
  transform:rotate(4deg);box-shadow:0 30px 60px rgb(0 0 0 / .45)}
.frame img{display:block;width:${f.w}px;height:${f.h}px;object-fit:cover}
.tape{position:absolute;top:-13px;left:31%;width:38%;height:26px;background:${C.olivePastel};opacity:.8;transform:rotate(-3deg)}
</style></head><body><div class="card">
<div class="glow"></div>
<img class="logo" src="${dataUri(logoPng, 'image/png')}" alt="">
<div class="copy"><h1 id="t">${titleHtml(copy.title)}</h1><p class="sub">${glue(copy.sub)}</p></div>
<div class="site"><i></i>${SITE}</div>
<div class="frame"><img src="${dataUri(pic.buf, 'image/jpeg')}" alt=""><span class="tape"></span></div>
</div><script>
// Длинный заголовок уменьшаем, пока блок не влезет в свою колонку.
document.fonts.ready.then(function(){
  var t=document.getElementById('t'),c=t.parentNode,s=68;
  while(s>40&&(c.scrollHeight>c.clientHeight||t.scrollWidth>t.clientWidth)){s-=2;t.style.fontSize=s+'px';}
  requestAnimationFrame(function(){requestAnimationFrame(function(){window.__ready=true;});});
});
</script></body></html>`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Один headless Chrome на все карточки, управление по DevTools-протоколу.
 * Режим --screenshot из командной строки на macOS снимок делает, но процесс
 * не завершается — поэтому так.
 */
async function startChrome(chrome, tmp) {
  const profile = join(tmp, 'profile');
  const proc = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--allow-file-access-from-files',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      `--window-size=${W},${H}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 300 && !existsSync(portFile); i++) await sleep(100);
  if (!existsSync(portFile)) {
    proc.kill();
    throw new Error('Chrome не запустился (нет DevToolsActivePort)');
  }
  await sleep(100);
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const p = m.id && pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++seq;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

  return {
    async shot(html, name) {
      const file = join(tmp, `${name}.html`);
      writeFileSync(file, html);
      await send('Page.navigate', { url: `file://${file}` });
      // Ждём шрифты и подгонку заголовка (страница ставит window.__ready).
      for (let i = 0; i < 200; i++) {
        const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true }).catch(() => null);
        if (r?.result?.value === true) break;
        await sleep(50);
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
      return Buffer.from(data, 'base64');
    },
    close() {
      ws.close();
      proc.kill();
    },
  };
}

/* ---------- запасной вариант: SVG в sharp ---------- */

/** Грубый перенос по числу символов — только для запасного режима. */
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > max) {
      lines.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines;
}

async function renderSvg(copy, { buf: photoBuf, f }) {
  const title = copy.title.map((p) => p.t ?? p.s).join(' ');
  const size = title.length > 30 ? 52 : 64;
  const lines = wrap(title, Math.floor(1000 / size));
  const subLines = wrap(copy.sub, 40);
  const top = 300 - ((lines.length * size * 1.08 + subLines.length * 34) / 2);
  const sans = "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><radialGradient id="g" cx="22%" cy="118%" r="75%"><stop offset="0" stop-color="${C.plum}" stop-opacity=".85"/><stop offset=".72" stop-color="${C.plum}" stop-opacity="0"/></radialGradient></defs>
<rect width="100%" height="100%" fill="${C.stage}"/><rect width="100%" height="100%" fill="url(#g)"/>
${lines.map((l, i) => `<text x="72" y="${top + size + i * size * 1.08}" font-family="${sans}" font-weight="800" font-size="${size}" fill="${C.onStage}">${esc(l)}</text>`).join('')}
${subLines.map((l, i) => `<text x="72" y="${top + lines.length * size * 1.08 + 44 + i * 34}" font-family="${sans}" font-size="25" fill="${C.muted}">${esc(l)}</text>`).join('')}
<circle cx="78" cy="572" r="6" fill="${C.olivePastel}"/><text x="98" y="580" font-family="${sans}" font-weight="700" font-size="22" fill="${C.onStage}">${SITE}</text>
<rect x="${f.left}" y="${f.top}" width="${f.w + 24}" height="${f.h + 56}" fill="${C.paper}"/></svg>`;
  const pic = await sharp(photoBuf).resize(f.w, f.h).toBuffer();
  const logo = await sharp(logoPng).resize({ width: 112 }).toBuffer();
  return sharp(Buffer.from(svg))
    .composite([
      { input: logo, left: 72, top: 46 },
      { input: pic, left: f.left + 12, top: f.top + 12 },
    ])
    .png()
    .toBuffer();
}

/* ---------- сборка ---------- */

mkdirSync(OUT, { recursive: true });
const chrome = findChrome();
if (!chrome) {
  console.warn('og: Chrome не найден — карточки собраны через SVG системным шрифтом (без Montserrat/Caveat). Задайте CHROME_PATH.');
}
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
const fonts = chrome ? fontFaces() : '';

let browser = null;
try {
  browser = chrome ? await startChrome(chrome, tmp) : null;
  for (const card of CARDS) {
    for (const lang of ['ru', 'en']) {
      const rel = typeof card.photo === 'function' ? card.photo(lang) : card.photo;
      const pic = await photo(rel);
      const name = `${card.id}-${lang}`;
      const src = browser ? await browser.shot(cardHtml(card[lang], pic, fonts), name) : await renderSvg(card[lang], pic);
      const out = join(OUT, `${name}.jpg`);
      const info = await sharp(src)
        .resize(W, H, { fit: 'cover', position: 'left top' })
        .flatten({ background: C.stage })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(out);
      const kb = Math.round(info.size / 1024);
      console.log(`og: img/og/${name}.jpg  ${info.width}×${info.height}  ${kb} KB  ← ${rel}`);
      if (info.size > 200 * 1024) console.warn(`og: ${name}.jpg больше 200 КБ`);
    }
  }
} finally {
  browser?.close();
  await sleep(300);
  rmSync(tmp, { recursive: true, force: true });
}
