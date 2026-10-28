/**
 * Отправка заявки.
 *
 * Заявки ведёт Кристина в WhatsApp: форма открывает чат с уже заполненным
 * текстом на языке посетителя, сообщение уходит, когда человек сам нажмёт
 * «Отправить». Сервера заявок у сайта нет. Окно открываем сразу по нажатию,
 * без await: иначе браузер примет его за всплывающую рекламу и заблокирует.
 */
import { CONTACTS } from '@/consts';

export type Lead = Record<string, string>;

const TEXT = {
  ru: {
    head: 'Заявка с сайта SIGNED DXB',
    labels: {
      name: 'Имя',
      contact: 'Контакт',
      task: 'Задача',
      service: 'Направление',
      expo: 'Выставка или объект',
      area: 'Площадь',
      dates: 'Даты',
      budget: 'Бюджет',
    } as Record<string, string>,
  },
  en: {
    head: 'Request from the SIGNED DXB website',
    labels: {
      name: 'Name',
      contact: 'Contact',
      task: 'Request',
      service: 'Service',
      expo: 'Exhibition or venue',
      area: 'Stand area',
      dates: 'Dates',
      budget: 'Budget',
    } as Record<string, string>,
  },
};

const pageLang = () => (document.documentElement.lang === 'en' ? 'en' : 'ru');

export function leadToText(lead: Lead): string {
  const t = TEXT[pageLang()];
  const lines = [t.head];
  for (const [k, v] of Object.entries(lead)) {
    if (v && t.labels[k]) lines.push(`${t.labels[k]}: ${v}`);
  }
  return lines.join('\n');
}

export function whatsappLink(lead: Lead): string {
  return `${CONTACTS.whatsapp}?text=${encodeURIComponent(leadToText(lead))}`;
}

/** Открывает WhatsApp с заявкой. */
export function sendLead(lead: Lead): void {
  window.open(whatsappLink(lead), '_blank', 'noopener');
}
