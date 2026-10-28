/**
 * Английская 404: Astro собирает src/pages/en/404.astro в dist/en/404/index.html,
 * а хостинг (Cloudflare Pages) ищет 404.html — ближайший по дереву каталогов.
 * Переносим страницу в dist/en/404.html, папку удаляем.
 */
import { rename, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const from = join(DIST, 'en', '404', 'index.html');
try {
  await access(from);
} catch {
  console.log('en-404: dist/en/404/index.html нет — переносить нечего');
  process.exit(0);
}
await rename(from, join(DIST, 'en', '404.html'));
await rm(join(DIST, 'en', '404'), { recursive: true, force: true });
console.log('en-404: dist/en/404.html готова');
