/**
 * Фотографии выполненных работ.
 *
 * Источник — блок «Фотоработы» в теме «Полезные материалы» группы проекта
 * (26.08.2026), по решению заказчика. Снимки обрезаны в квадрат и лежат в
 * public/img/works/ в двух размерах: wNN-600 и wNN-1200 (webp) + wNN-600.jpg.
 *
 * Подписи описывают технологию, а не бренд на вывеске: названия на фото —
 * это заказчики производства, а не клиенты SIGNUP DXB, и подписью мы этого
 * не утверждаем.
 */
import type { Lang } from '@/i18n';

/** Слаги категорий из data/production.ts. */
type Cat =
  | 'illuminated-signage'
  | 'rooftop'
  | 'signs-and-plates'
  | 'interior-print'
  | 'window-branding'
  | 'vehicle-branding';

export type Work = {
  id: string;
  cats: Cat[];
  /** Показывать на главной. */
  featured?: boolean;
  title: Record<Lang, string>;
};

const WORKS: Work[] = [
  { id: '27', cats: ['illuminated-signage'], featured: true, title: { ru: 'Фасадная вывеска: световой короб и объёмные буквы', en: 'Shopfront sign: lightbox with built-up letters' } },
  { id: '17', cats: ['illuminated-signage'], featured: true, title: { ru: 'Буквы с контражурной подсветкой', en: 'Halo-lit letters' } },
  { id: '24', cats: ['illuminated-signage'], featured: true, title: { ru: 'Неоновая вывеска из гибкого неона', en: 'Flexible neon sign' } },
  { id: '36', cats: ['interior-print'], featured: true, title: { ru: 'Логотип на акцентной стене', en: 'Logo on an accent wall' } },
  { id: '20', cats: ['illuminated-signage'], featured: true, title: { ru: 'Световые буквы на козырьке входа', en: 'Illuminated letters on an entrance canopy' } },
  { id: '50', cats: ['illuminated-signage', 'signs-and-plates'], featured: true, title: { ru: 'Табличка с подсветкой на оргстекле', en: 'Backlit acrylic sign' } },
  { id: '37', cats: ['rooftop'], featured: true, title: { ru: 'Крышная установка', en: 'Rooftop sign' } },
  { id: '43', cats: ['illuminated-signage', 'interior-print'], featured: true, title: { ru: 'Неон на оргстекле поверх фитостены', en: 'Neon on acrylic over a green wall' } },
  { id: '12', cats: ['illuminated-signage'], featured: true, title: { ru: 'Световые буквы в торговом центре', en: 'Illuminated letters in a mall' } },
  { id: '03', cats: ['illuminated-signage'], title: { ru: 'Световой короб', en: 'Lightbox' } },
  { id: '30', cats: ['illuminated-signage'], title: { ru: 'Фасадная вывеска с подсветкой', en: 'Illuminated shopfront sign' } },
  { id: '32', cats: ['illuminated-signage'], title: { ru: 'Вывеска на козырьке входной группы', en: 'Entrance canopy sign' } },
  { id: '11', cats: ['illuminated-signage'], title: { ru: 'Световой логотип над входом в магазин', en: 'Illuminated logo above a store entrance' } },
  { id: '04', cats: ['illuminated-signage'], title: { ru: 'Неоновая надпись на двери', en: 'Neon lettering on a door' } },
  { id: '28', cats: ['illuminated-signage'], title: { ru: 'Неон сложного контура', en: 'Complex-contour neon' } },
  { id: '34', cats: ['illuminated-signage'], title: { ru: 'Неоновая надпись', en: 'Neon lettering' } },
  { id: '56', cats: ['signs-and-plates'], title: { ru: 'Объёмные буквы на фасаде', en: 'Built-up letters on a facade' } },
  { id: '01', cats: ['signs-and-plates', 'window-branding'], title: { ru: 'Буквы на фасаде и оформление входной группы', en: 'Facade letters and entrance graphics' } },
  { id: '48', cats: ['signs-and-plates'], title: { ru: 'Навигация в здании', en: 'Building wayfinding' } },
  { id: '25', cats: ['signs-and-plates'], title: { ru: 'Информационный стенд', en: 'Information board' } },
  { id: '05', cats: ['interior-print'], title: { ru: 'Логотип на фитостене', en: 'Logo on a green wall' } },
  { id: '06', cats: ['interior-print', 'signs-and-plates'], title: { ru: 'Логотип из золотого пластика', en: 'Gold plastic logo' } },
  { id: '07', cats: ['interior-print'], title: { ru: 'Объёмный логотип в интерьере', en: '3D logo in an interior' } },
  { id: '14', cats: ['interior-print'], title: { ru: 'Объёмные буквы на ресепшене', en: 'Built-up letters on a reception desk' } },
  { id: '41', cats: ['interior-print', 'signs-and-plates'], title: { ru: 'Буквы под металл в офисе', en: 'Metal-finish letters in an office' } },
  { id: '51', cats: ['interior-print'], title: { ru: 'Брендирование ресепшена', en: 'Reception branding' } },
  { id: '19', cats: ['window-branding'], title: { ru: 'Матовая плёнка на стеклянных перегородках', en: 'Frosted film on glass partitions' } },
  { id: '67', cats: ['vehicle-branding'], title: { ru: 'Брендирование автомобиля плоттерной резкой', en: 'Vehicle branding with plotter-cut film' } },
];

export const works = (): Work[] => WORKS;
export const featuredWorks = (): Work[] => WORKS.filter((w) => w.featured);
export const worksFor = (slug: string): Work[] => WORKS.filter((w) => (w.cats as string[]).includes(slug));
export const workById = (id: string): Work | undefined => WORKS.find((w) => w.id === id);
export const workTitle = (w: Work, lang: Lang) => w.title[lang];
