/**
 * Внутренняя ссылка с учётом подпапки сайта.
 *
 * На GitHub Pages сайт живёт в /signup-dxb/, на боевом домене — в корне.
 * Подпапку задаёт BASE_PATH при сборке (см. astro.config.mjs).
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const link = (path: string): string => (path.startsWith('/') ? `${BASE}${path}` : path);

/** Путь страницы без подпапки — для подсветки активного пункта меню. */
export const unbase = (pathname: string): string =>
  BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
