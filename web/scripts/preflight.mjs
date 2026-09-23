/**
 * Проверка перед сборкой. На боевом домене падает, если в сайте остались
 * незаполненные данные заказчика или не хватает обязательных файлов.
 * На превью в GitHub Pages только предупреждает: там заглушки ожидаемы.
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE_URL ?? '';
const IS_PROD = SITE !== '' && !SITE.includes('github.io') && !SITE.includes('127.0.0.1') && !SITE.includes('localhost');

const problems = [];

// 1. Заглушки вида [ЮР. НАЗВАНИЕ КОМПАНИИ] в квадратных скобках.
const consts = await readFile(join(ROOT, 'src/consts.ts'), 'utf8');
for (const m of consts.matchAll(/^\s*(\w+):\s*'(\[[^']*\])'/gm)) {
  problems.push(`не заполнено в consts.ts: ${m[1]} = ${m[2]}`);
}

// 2. Обязательные файлы.
for (const f of ['public/img/og.jpg', 'public/img/icon-180.png', 'public/favicon.svg']) {
  try {
    await access(join(ROOT, f));
  } catch {
    problems.push(`нет файла: ${f}`);
  }
}

if (problems.length === 0) {
  console.log('preflight: всё на месте');
} else if (IS_PROD) {
  console.error(`\npreflight: сборка для ${SITE} остановлена.\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\nЗаполните данные в web/src/consts.ts и соберите снова.\n');
  process.exit(1);
} else {
  console.warn('preflight: превью собирается, но перед боевым доменом нужно закрыть:');
  for (const p of problems) console.warn(`  • ${p}`);
}
