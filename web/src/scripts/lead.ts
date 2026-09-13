/**
 * Отправка заявки.
 *
 * Основной путь — POST /api/lead (functions/api/lead.ts): письмо на почту и
 * сообщение в Telegram. Если функция ещё не настроена или недоступна, заявка
 * не теряется — открываем WhatsApp с уже заполненным текстом.
 */

export type Lead = Record<string, string>;

const WA_NUMBER = '971502457669';

const LABELS: Record<string, string> = {
  name: 'Имя',
  contact: 'Контакт',
  task: 'Задача',
  service: 'Направление',
  expo: 'Выставка или объект',
  area: 'Площадь',
  dates: 'Даты',
  budget: 'Бюджет',
  page: 'Страница',
};

export function leadToText(lead: Lead): string {
  const lines = ['Заявка с сайта SIGNUP DXB'];
  for (const [k, v] of Object.entries(lead)) {
    if (v && k !== 'page') lines.push(`${LABELS[k] ?? k}: ${v}`);
  }
  return lines.join('\n');
}

export function whatsappLink(lead: Lead): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(leadToText(lead))}`;
}

export async function sendLead(lead: Lead): Promise<'sent' | 'whatsapp'> {
  const payload = { ...lead, page: location.pathname };
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
  window.open(whatsappLink(payload), '_blank', 'noopener');
  return 'whatsapp';
}
