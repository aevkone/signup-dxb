/**
 * Отправка заявки.
 *
 * Основной путь — POST /api/lead (functions/api/lead.ts): письмо на почту и
 * сообщение в Telegram. Если функция ещё не настроена или недоступна (как на
 * GitHub Pages), заявка не теряется — открываем WhatsApp с уже заполненным
 * текстом на языке посетителя.
 */

export type Lead = Record<string, string>;

const WA_NUMBER = '971502457669';

/** Предел на макет. Телеграм принимает до 50 МБ, но 10 хватает и грузится быстро. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const TEXT = {
  ru: {
    head: 'Заявка с сайта SIGNUP DXB',
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
    head: 'Request from the SIGNUP DXB website',
    labels: {
      name: 'Name',
      contact: 'Contact',
      task: 'Request',
      service: 'Direction',
      expo: 'Exhibition or site',
      area: 'Stand size',
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
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(leadToText(lead))}`;
}

/**
 * Отправляет заявку. Если приложен файл — уходит multipart, иначе JSON.
 * Через WhatsApp файл не передать: ссылка wa.me умеет только текст, поэтому
 * форма отдельно просит приложить макет в переписке.
 */
export async function sendLead(lead: Lead, file?: File | null): Promise<'sent' | 'whatsapp'> {
  const payload = { ...lead, lang: pageLang().toUpperCase(), page: location.pathname };
  const url = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/api/lead`;
  try {
    let res: Response;
    if (file && file.size <= MAX_FILE_BYTES) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(payload)) fd.append(k, v);
      fd.append('file', file, file.name);
      res = await fetch(url, { method: 'POST', body: fd });
    } else {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (data.ok) return 'sent';
    }
  } catch {
    /* сеть или функция недоступна — уходим в WhatsApp */
  }
  window.open(whatsappLink(lead), '_blank', 'noopener');
  return 'whatsapp';
}