/**
 * Светлый логотип (шапка 60 px, подвал 92 px) — webp с потерями под реальные размеры:
 * 120 (шапка 2x, подвал 1x), 184 (подвал 2x, шапка 3x), 320 (подвал 3x).
 * Источник — logo-light-320.png (прозрачный фон). Запуск из папки web:
 * node scripts/logo-webp.mjs
 */
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const IMG = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const SRC = join(IMG, 'logo-light-320.png');

for (const w of [120, 184, 320]) {
  const out = join(IMG, `logo-light-${w}.webp`);
  // Качество подобрано на глаз на тёмном фоне: подсветка портала без полос, буквы чёткие.
  await sharp(SRC).resize(w).webp({ quality: 75, alphaQuality: 70, effort: 6 }).toFile(out);
  console.log(`logo-light-${w}.webp: ${(statSync(out).size / 1024).toFixed(1)} КБ`);
}
