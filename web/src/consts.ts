/**
 * Контакты, реквизиты и коммерческие условия — единственное место.
 * Источник — ответы заказчика от 13.09.2026 (_input/answers-2026-09-13.docx).
 * В квадратных скобках — то, что заказчик пока не дал.
 */
import type { Lang } from '@/i18n';

export const CONTACTS = {
  phone: '+971 50 245 7669',
  phoneHref: 'tel:+971502457669',
  whatsapp: 'https://wa.me/971502457669',
} as const;

const L = {
  ru: {
    hours: 'Ежедневно, 9:00–20:00',
    replyTime: 'в течение суток',
    legalName: '[ЮР. НАЗВАНИЕ КОМПАНИИ]',
    licence: '[НОМЕР ЛИЦЕНЗИИ]',
    address: '[АДРЕС ИЗ ЛИЦЕНЗИИ]',
    /** Замер платный, сумма засчитывается в заказ. */
    survey: 'от 500 AED',
    minOrder: 'от 2 000 AED',
    productionArea: 'Дубай, Шарджа, Аджман',
    exhibitionsArea: 'Дубай, Абу-Даби, Шарджа, Аджман',
    budgets: ['до 10 000 AED', '10 000–50 000 AED', '50 000–100 000 AED', 'больше 100 000 AED', 'пока не знаю'],
    areas: ['до 12 м²', '12–36 м²', '36–100 м²', 'больше 100 м²', 'пока не знаю'],
    siteTitle: 'SIGNUP DXB — выставки в Дубае под ключ',
    siteDescription:
      'Организуем участие в выставках в Дубае и Абу-Даби под ключ: стенд, печать, персонал, питание, логистика, консьерж-сервис. Собственное производство наружной рекламы.',
    nav: ['Выставки под ключ', 'Производство', 'Консьерж-сервис', 'Контакты'],
  },
  en: {
    hours: 'Daily, 9 am – 8 pm',
    replyTime: 'within 24 hours',
    legalName: '[COMPANY LEGAL NAME]',
    licence: '[LICENCE NUMBER]',
    address: '[ADDRESS PER LICENCE]',
    survey: 'from AED 500',
    minOrder: 'from AED 2,000',
    productionArea: 'Dubai, Sharjah, Ajman',
    exhibitionsArea: 'Dubai, Abu Dhabi, Sharjah, Ajman',
    budgets: ['under AED 10,000', 'AED 10,000–50,000', 'AED 50,000–100,000', 'over AED 100,000', 'not sure yet'],
    areas: ['up to 12 m²', '12–36 m²', '36–100 m²', 'over 100 m²', 'not sure yet'],
    siteTitle: 'SIGNUP DXB — turnkey exhibitions in Dubai',
    siteDescription:
      'Turnkey exhibition participation in Dubai and Abu Dhabi: stand, print, staff, catering, logistics and concierge. In-house production of outdoor advertising.',
    nav: ['Turnkey exhibitions', 'Production', 'Concierge', 'Contacts'],
  },
} as const;

export type Local = (typeof L)[Lang];
export const local = (lang: Lang) => L[lang];

export const SITE_NAME = 'SIGNUP DXB';

export type NavItem = { href: string; label: string };

const NAV_HREFS = ['/exhibitions/', '/production/', '/exhibitions/concierge/', '/contacts/'];

export const nav = (lang: Lang): NavItem[] => NAV_HREFS.map((href, i) => ({ href, label: L[lang].nav[i] }));
