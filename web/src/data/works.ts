/**
 * Фотографии выполненных работ.
 *
 * Пока массив пуст, секция «Наши работы» не выводится совсем — пустых рамок
 * и заглушек на сайте не появляется.
 *
 * Чтобы добавить работу:
 *   1. положить снимок в `web/public/img/works/` (JPEG или WebP, ширина от 1600 px);
 *   2. дописать сюда строку с подписью на двух языках.
 *
 * Сюда идут только реальные снимки заказчика. Подставлять стоковые или
 * сгенерированные изображения нельзя: подпись «наша работа» под чужим или
 * несуществующим объектом — это введение клиента в заблуждение.
 */
import type { Lang } from '@/i18n';

export type Work = {
  /** Файл в /img/works/, например 'vitrina-jbr.jpg'. */
  src: string;
  /** Подпись под снимком. */
  title: Record<Lang, string>;
  /** Что именно делали: одна короткая строка. */
  note?: Record<Lang, string>;
  /** Пропорции кадра, чтобы вёрстка не прыгала при загрузке. */
  width: number;
  height: number;
};

const WORKS: Work[] = [];

export const works = (): Work[] => WORKS;
export const workTitle = (w: Work, lang: Lang) => w.title[lang];
export const workNote = (w: Work, lang: Lang) => w.note?.[lang];
