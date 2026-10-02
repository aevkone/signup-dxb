/**
 * Средний размер фото работ: public/img/works/wNN-800.webp из wNN-1200.webp.
 * Нужен телефонам с экраном 2x: слот ~350 px → 700 px картинки, и без
 * промежуточного размера браузер брал бы файл 1200.
 * Запуск из папки web: node scripts/works-800.mjs (уже готовые файлы не трогает).
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'works');

for (const f of readdirSync(DIR).filter((n) => n.endsWith('-1200.webp'))) {
  const out = join(DIR, f.replace('-1200.webp', '-800.webp'));
  if (existsSync(out)) continue;
  await sharp(join(DIR, f)).resize(800, 800, { fit: 'inside' }).webp({ quality: 74, effort: 6 }).toFile(out);
  console.log(`${out.split('/').pop()}: ${(statSync(out).size / 1024).toFixed(1)} КБ`);
}
