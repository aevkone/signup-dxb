/**
 * Проверка перед сборкой. На боевом домене падает, если в сайте остались
 * незаполненные данные заказчика или не хватает обязательных файлов.
 * На превью в GitHub Pages только предупреждает: там заглушки ожидаемы.
 *
 * С флагом --dist запускается после сборки и проверяет готовые страницы:
 * пока лицензия истекла или почта не настроена, в dist не должно остаться
 * её номера, формулировок «под нашей лицензией» и адреса почты. Здесь сборка
 * падает всегда — и на превью, и на боевом домене.
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE_URL ?? '';
const IS_PROD = SITE !== '' && !SITE.includes('github.io') && !SITE.includes('127.0.0.1') && !SITE.includes('localhost');

const problems = [];
const consts = await readFile(join(ROOT, 'src/consts.ts'), 'utf8');
const exp = consts.match(/LICENCE_EXPIRES = '(\d{4}-\d{2}-\d{2})'/)?.[1];
/** То же правило, что LICENCE_VALID в consts.ts. */
const LICENCE_VALID = exp ? Date.parse(`${exp}T23:59:59+04:00`) >= Date.now() : true;
/** Почта пустая, пока у домена нет MX (CONTACTS.email в consts.ts). */
const EMAIL_EMPTY = /^\s*email:\s*''/m.test(consts);

if (process.argv.includes('--dist')) {
  const DIST = join(ROOT, 'dist');
  /** Что не должно попасть в готовые страницы — и почему. */
  const banned = [
    ...(LICENCE_VALID
      ? []
      : [
          ['107257', 'Номер истёкшей лицензии в dist'],
          ['под нашей лицензией', 'Участие под нашей лицензией при истёкшей лицензии'],
          ['на нашу компанию', 'Оформление на нашу компанию при истёкшей лицензии'],
          ['under our licence', 'Exhibiting under our licence при истёкшей лицензии'],
          ['under our company', 'Registering under our company при истёкшей лицензии'],
        ]),
    ...(EMAIL_EMPTY
      ? [
          ['info@signeddxb.com', 'Адрес почты без MX в dist'],
          ['mailto:', 'Ссылка mailto: при ненастроенной почте'],
        ]
      : []),
  ];
  async function* walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) yield* walk(p);
      else if (e.name.endsWith('.html')) yield p;
    }
  }
  const found = [];
  for await (const file of walk(DIST)) {
    const html = await readFile(file, 'utf8');
    for (const [needle, why] of banned) if (html.includes(needle)) found.push(`${why}: «${needle}» — ${file.slice(DIST.length + 1)}`);
  }
  if (found.length) {
    console.error(`\npreflight --dist: в собранном сайте осталось то, чего сейчас быть не должно (${found.length}):\n`);
    for (const p of found) console.error(`  ✗ ${p}`);
    console.error('');
    process.exit(1);
  }
  console.log(`preflight --dist: проверено правил — ${banned.length}, нарушений нет`);
  process.exit(0);
}

// 1. Заглушки вида [ЮР. НАЗВАНИЕ КОМПАНИИ] в квадратных скобках.
for (const m of consts.matchAll(/^\s*(\w+):\s*'(\[[^']*\])'/gm)) {
  problems.push(`не заполнено в consts.ts: ${m[1]} = ${m[2]}`);
}

// 2. Почта. Пустая — сознательно, пока у домена нет MX: сайт её не показывает, сборку не останавливаем.
if (EMAIL_EMPTY) console.warn('preflight: почта не настроена (email пустой) — на сайте скрыта; после настройки MX вернуть адрес в consts.ts');

// 3. Срок лицензии.
if (exp) {
  const days = Math.floor((Date.parse(`${exp}T23:59:59+04:00`) - Date.now()) / 86400000);
  // Номер истёкшей лицензии сайт сам скрывает (LICENCE_VALID в consts.ts), поэтому сборку не останавливаем.
  if (days < 0) console.warn(`preflight: лицензия истекла ${exp} — номер на сайте скрыт; пришлите новую и обновите consts.ts`);
  else if (days <= 14) console.warn(`preflight: лицензия истекает ${exp}, осталось дней: ${days}`);
}

// 4. Обязательные файлы.
for (const f of ['public/img/og.jpg', 'public/img/icon-180.png', 'public/favicon.png']) {
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
