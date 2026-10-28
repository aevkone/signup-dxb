/**
 * Логотип SIGNED DXB из растра, выбранного заказчиком 07.09.2026: портал берётся
 * из старого файла (верхние 350 px), надпись «signed» и «DXB» набирается заново
 * шрифтом Montserrat — в старом растре было «signup». Вектора у заказчика нет.
 *
 * Пишет public/img/logo.png и logo-dark-bg.png (640×635), logo-160/320 (png, webp)
 * и logo-light-160/320.png; светлые webp потом — node scripts/logo-webp.mjs.
 * Исходники портала — _src/logo-portal*.png (из старых logo.png и logo-dark-bg.png).
 * Запуск из папки web: node scripts/logo.mjs
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'public', 'img');
const SRC = join(ROOT, 'scripts', '_src');
const FONT = join(ROOT, 'node_modules', '@fontsource-variable', 'montserrat', 'files', 'montserrat-latin-wght-normal.woff2');
const W = 640;
const H = 635;

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Не найден Chrome: задайте CHROME_PATH');

/**
 * Надпись: «signed» по ширине старого «signup» (x 74–570), верх строчных — y 412,
 * «D X B» разреженными прописными — по центру, шириной 176 px, низ — y 631.
 */
function page(portal, color) {
  return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(${pathToFileURL(FONT)}) format('woff2');font-weight:100 900}
body{margin:0}</style><body><canvas id="c" width="${W}" height="${H}"></canvas><pre id="out"></pre><script>
(async()=>{
  await document.fonts.load('600 100px M','signedDXB');await document.fonts.load('400 100px M','DXB');
  const c=document.getElementById('c').getContext('2d');
  const img=new Image();img.src=${JSON.stringify(portal)};await img.decode();
  c.drawImage(img,0,0);
  c.fillStyle='${color}';c.textBaseline='alphabetic';
  // signed: подгоняем кегль под ширину, трекинг чуть плотнее обычного
  let size=200;c.font='600 '+size+'px M';
  const track=-0.035;
  const width=(s)=>{c.font='600 '+s+'px M';let w=0;for(const ch of 'signed')w+=c.measureText(ch).width+track*s;return w-track*s;};
  size=size*496/width(size);
  c.font='600 '+size+'px M';
  const xh=c.measureText('x').actualBoundingBoxAscent;
  const base=412+xh;
  let x=(${W}-width(size))/2;
  for(const ch of 'signed'){c.fillText(ch,x,base);x+=c.measureText(ch).width+track*size;}
  // D X B
  const cap=42;let s2=100;c.font='400 '+s2+'px M';
  s2=s2*cap/c.measureText('D').actualBoundingBoxAscent;c.font='400 '+s2+'px M';
  const letters=['D','X','B'];const lw=letters.reduce((a,l)=>a+c.measureText(l).width,0);
  const gap=(176-lw)/2;const tw=176;
  let x2=(${W}-tw)/2;for(const l of letters){c.fillText(l,x2,631);x2+=c.measureText(l).width+gap;}
  document.getElementById('out').textContent=document.getElementById('c').toDataURL('image/png');
})();
</script>`;
}

async function render(portalFile, color) {
  const portal = `data:image/png;base64,${readFileSync(join(SRC, portalFile)).toString('base64')}`;
  const dir = mkdtempSync(join(tmpdir(), 'logo-'));
  const html = join(dir, 'logo.html');
  writeFileSync(html, page(portal, color));
  const r = spawnSync(
    CHROME,
    ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=5000', '--dump-dom', pathToFileURL(html).href],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  rmSync(dir, { recursive: true, force: true });
  const m = r.stdout.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error(`Chrome не отдал картинку: ${r.stderr.slice(0, 400)}`);
  return Buffer.from(m[1], 'base64');
}

const dark = await render('logo-portal.png', '#050505');
const light = await render('logo-portal-dark-bg.png', '#f5f5f5');
await sharp(dark).png().toFile(join(IMG, 'logo.png'));
await sharp(light).png().toFile(join(IMG, 'logo-dark-bg.png'));
for (const w of [160, 320]) {
  await sharp(dark).resize(w).png({ compressionLevel: 9 }).toFile(join(IMG, `logo-${w}.png`));
  await sharp(dark).resize(w).webp({ quality: 82, alphaQuality: 80, effort: 6 }).toFile(join(IMG, `logo-${w}.webp`));
  await sharp(light).resize(w).png({ compressionLevel: 9 }).toFile(join(IMG, `logo-light-${w}.png`));
}
console.log('логотип пересобран; дальше: node scripts/logo-webp.mjs');
