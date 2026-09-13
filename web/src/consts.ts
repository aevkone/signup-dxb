/**
 * Контакты, реквизиты и коммерческие условия — единственное место.
 * Источник — ответы заказчика от 13.09.2026 (_input/answers-2026-09-13.docx).
 * В квадратных скобках — то, что заказчик пока не дал.
 */

export const CONTACTS = {
  phone: '+971 50 245 7669',
  phoneHref: 'tel:+971502457669',
  whatsapp: 'https://wa.me/971502457669',
  /** Почта на домене появится после покупки домена. */
  email: '[ПОЧТА НА ДОМЕНЕ]',
  emailHref: '',
  hours: 'Ежедневно, 9:00–20:00',
  replyTime: 'в течение суток',
} as const;

export const LEGAL = {
  name: '[ЮР. НАЗВАНИЕ КОМПАНИИ]',
  licence: '[НОМЕР ЛИЦЕНЗИИ]',
  address: '[АДРЕС ИЗ ЛИЦЕНЗИИ]',
} as const;

export const TERMS = {
  /** Замер платный, сумма засчитывается в заказ. */
  survey: 'от 500 AED',
  minOrder: 'от 2 000 AED',
  /** Производство и монтаж. */
  productionArea: 'Дубай, Шарджа, Аджман',
  /** Выставки — плюс Абу-Даби. */
  exhibitionsArea: 'Дубай, Абу-Даби, Шарджа, Аджман',
  budgets: ['до 10 000 AED', '10 000–50 000 AED', '50 000–100 000 AED', 'больше 100 000 AED', 'пока не знаю'],
} as const;

export const SITE = {
  name: 'SIGNUP DXB',
  title: 'SIGNUP DXB — выставки в Дубае под ключ',
  description:
    'Организуем участие в выставках в Дубае и Абу-Даби под ключ: стенд, печать, персонал, питание, логистика, консьерж-сервис. Собственное производство наружной рекламы.',
} as const;

export type NavItem = { href: string; label: string };

export const NAV: NavItem[] = [
  { href: '/exhibitions/', label: 'Выставки под ключ' },
  { href: '/production/', label: 'Производство' },
  { href: '/exhibitions/concierge/', label: 'Консьерж-сервис' },
  { href: '/contacts/', label: 'Контакты' },
];
