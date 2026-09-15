/**
 * Языки сайта. Русский — в корне, остальные — в своей подпапке (/en/).
 * Арабский добавится сюда же отдельной строкой, когда будет перевод.
 */
export const LANGS = ['ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'ru';

export const LANG_LABEL: Record<Lang, string> = { ru: 'RU', en: 'EN' };

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Путь страницы без подпапки сайта и без языкового префикса. */
export function splitPath(pathname: string): { lang: Lang; path: string } {
  let p = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!p.startsWith('/')) p = `/${p}`;
  for (const l of LANGS) {
    if (l === DEFAULT_LANG) continue;
    if (p === `/${l}` || p.startsWith(`/${l}/`)) return { lang: l, path: p.slice(l.length + 1) || '/' };
  }
  return { lang: DEFAULT_LANG, path: p };
}

export const getLang = (url: URL): Lang => splitPath(url.pathname).lang;

/** Внутренняя ссылка: подпапка сайта + языковой префикс + путь. */
export function link(path: string, lang: Lang = DEFAULT_LANG): string {
  if (!path.startsWith('/')) return path;
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  return `${BASE}${prefix}${path}`;
}
