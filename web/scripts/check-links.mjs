/**
 * Проверка внутренних ссылок в собранном сайте: каждая ссылка должна вести
 * на существующую страницу или файл. Ловит опечатки в путях до публикации.
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/+$/, '');

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const broken = [];
let checked = 0;

for await (const file of walk(DIST)) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    let href = m[1];
    if (BASE && href.startsWith(BASE)) href = href.slice(BASE.length) || '/';
    const target = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
    checked++;
    try {
      await access(target);
    } catch {
      broken.push(`${relative(DIST, file)} → ${m[1]}`);
    }
  }
}

if (broken.length) {
  console.error(`\ncheck-links: битых внутренних ссылок — ${broken.length}\n`);
  for (const b of [...new Set(broken)]) console.error(`  ✗ ${b}`);
  console.error('');
  process.exit(1);
}
console.log(`check-links: ${checked} внутренних ссылок, битых нет`);
