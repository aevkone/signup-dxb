/**
 * Отправка заявки.
 *
 * Заявки ведёт Кристина в WhatsApp: форма открывает чат с уже заполненным
 * текстом на языке посетителя, сообщение уходит, когда человек сам нажмёт
 * «Отправить». Сервера заявок у сайта нет. Окно открываем сразу по нажатию,
 * без await: иначе браузер примет его за всплывающую рекламу и заблокирует.
 *
 * Сайт не знает, ушло ли сообщение, поэтому после нажатия честно показываем
 * «подготовили сообщение» и запасные пути: кнопку WhatsApp, копирование текста
 * и телефон (wireDone ниже).
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
      /** Ориентир по прайсу, который посчитал сайт, — не слова клиента. */
      guide: 'Ориентир с сайта',
    } as Record<string, string>,
  },
  en: {
    head: 'Request from the SIGNED DXB website',
    labels: {
      name: 'Name',
      contact: 'Contact',
      task: 'Task',
      service: 'Service',
      expo: 'Exhibition or venue',
      area: 'Stand area',
      dates: 'Dates',
      budget: 'Budget',
      guide: 'Guide price from the website',
    } as Record<string, string>,
  },
};

const pageLang = () => (document.documentElement.lang === 'en' ? 'en' : 'ru');

/** Текст заявки. Пустые поля не выводятся; ориентир сайта — всегда последней строкой. */
export function leadToText(lead: Lead): string {
  const t = TEXT[pageLang()];
  const lines = [t.head];
  const keys = Object.keys(lead).filter((k) => k !== 'guide');
  if (lead.guide) keys.push('guide');
  for (const k of keys) {
    const v = lead[k]?.trim();
    if (v && t.labels[k]) lines.push(`${t.labels[k]}: ${v}`);
  }
  return lines.join('\n');
}

export function whatsappLink(lead: Lead): string {
  return `${CONTACTS.whatsapp}?text=${encodeURIComponent(leadToText(lead))}`;
}

/**
 * Открывает WhatsApp с заявкой и возвращает ссылку — для запасной кнопки.
 * Без 'noopener' в третьем аргументе: с ним браузер открывает окно без
 * возможности проверить результат; rel="noopener" стоит у запасной ссылки.
 */
export function sendLead(lead: Lead): string {
  const url = whatsappLink(lead);
  window.open(url, '_blank');
  return url;
}

/**
 * Блок «Подготовили сообщение» ([data-done]): запасная ссылка на чат
 * с тем же текстом и копирование текста заявки. Если буфер обмена
 * недоступен или запись не удалась — кнопку копирования прячем.
 */
export function wireDone(done: HTMLElement, lead: Lead, url: string): void {
  const open = done.querySelector<HTMLAnchorElement>('[data-done-wa]');
  if (open) open.href = url;
  const copy = done.querySelector<HTMLButtonElement>('[data-done-copy]');
  if (!copy) return;
  const label = copy.dataset.label ?? copy.textContent ?? '';
  if (!navigator.clipboard?.writeText) {
    copy.hidden = true;
    return;
  }
  copy.hidden = false;
  copy.textContent = label;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(leadToText(lead));
      copy.textContent = copy.dataset.copied ?? label;
      window.setTimeout(() => (copy.textContent = label), 2000);
    } catch {
      copy.hidden = true;
    }
  };
}
