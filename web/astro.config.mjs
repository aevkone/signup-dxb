// @ts-check
import { defineConfig } from 'astro/config';

// Адрес и подпапка сайта задаются при сборке:
//   GitHub Pages — SITE_URL=https://<аккаунт>.github.io, BASE_PATH=/<репозиторий>
//   боевой домен — SITE_URL=https://<домен>, BASE_PATH не задаётся
const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
