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

export async function sendLead(lead: Lead): Promise<'sent' | 'whatsapp'> {
  const payload = { ...lead, lang: pageLang().toUpperCase(), page: location.pathname };
  try {
    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/+$/, '')}/api/lead`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
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