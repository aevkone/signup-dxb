/**
 * Кадры 3D-стенда для public/img/stand/: stand-<n>-1600.webp, -800.webp, -800.jpg
 * (stand-en-* — с английскими надписями). Снимает сцену с dev-страницы /proto/stills/
 * в Chrome без окна. Нужен запущенный dev-сервер: npm run dev -- --host 127.0.0.1
 *
 * Запуск из папки web: node scripts/stand-stills.mjs
 * Проба кадра: node scripts/stand-stills.mjs --probe 10,12 → полные кадры в папку tmp.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'img', 'stand');
const DEV = process.env.DEV_URL ?? 'http://127.0.0.1:4321';
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Не найден Chrome: задайте CHROME_PATH');

/** Сторона сцены и кадр 4:3 внутри неё — стенд крупно, как на прежних кадрах. */
const SIZE = 2000;
const CROP = [0, 160, 2000, 1500];
/** Моменты сцены (с): стенд собран, гости у стойки; камера с четырёх сторон. */
const SHOTS = [10.5, 9.6, 11.6, 12.6];

function shoot(lang, times, size, crop) {
  const url = `${DEV}${lang === 'en' ? '/en' : ''}/proto/stills/?t=${times.join(',')}&size=${size}&crop=${crop.join(',')}`;
  const r = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      `--window-size=${size + 40},${size + 40}`,
      '--hide-scrollbars',
      '--virtual-time-budget=120000',
      '--dump-dom',
      url,
    ],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 600000 },
  );
  const shots = [...r.stdout.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map((m) => Buffer.from(m[1], 'base64'));
  if (shots.length !== times.length) throw new Error(`Chrome отдал ${shots.length} кадров из ${times.length}: ${r.stderr.slice(-400)}`);
  return shots;
}

const probe = process.argv.indexOf('--probe');
if (probe > 0) {
  const times = process.argv[probe + 1].split(',').map(Number);
  const dir = join(tmpdir(), 'stand-probe');
  mkdirSync(dir, { recursive: true });
  shoot('ru', times, 1000, [0, 0, 1000, 1000]).forEach((b, i) => {
    const f = join(dir, `t${times[i]}.png`);
    writeFileSync(f, b);
    console.log(f);
  });
} else {
  for (const lang of ['ru', 'en']) {
    const shots = shoot(lang, SHOTS, SIZE, CROP);
    for (const [i, png] of shots.entries()) {
      const base = join(OUT, `${lang === 'en' ? 'stand-en' : 'stand'}-${i + 1}`);
      await sharp(png).resize(1600).webp({ quality: 78, effort: 6 }).toFile(`${base}-1600.webp`);
      await sharp(png).resize(800).webp({ quality: 80, effort: 6 }).toFile(`${base}-800.webp`);
      await sharp(png).resize(800).jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}-800.jpg`);
      console.log(`${base}: готово`);
    }
  }
}
