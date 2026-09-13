/**
 * Приём заявок — Cloudflare Pages Function, POST /api/lead.
 *
 * Отправляет заявку в Telegram и на почту. Каналы включаются переменными
 * окружения в настройках проекта Cloudflare Pages:
 *
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  — сообщение в Telegram
 *   RESEND_API_KEY, LEAD_EMAIL_TO, LEAD_EMAIL_FROM — письмо через Resend
 *
 * Пока ни один канал не настроен, отвечаем ok:false — сайт откроет WhatsApp
 * с заполненной заявкой, и она не потеряется.
 */

type PagesFunction<E> = (ctx: { request: Request; env: E }) => Promise<Response>;

interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  LEAD_EMAIL_TO?: string;
  LEAD_EMAIL_FROM?: string;
}

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const lead: Record<string, string> = {};
  for (const key of Object.keys(LABELS)) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) lead[key] = v.trim().slice(0, 2000);
  }
  if (!lead.contact) return json({ ok: false, error: 'no_contact' }, 422);

  const text = ['Заявка с сайта SIGNUP DXB', ...Object.entries(lead).map(([k, v]) => `${LABELS[k]}: ${v}`)].join('\n');

  const jobs: Promise<boolean>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
      }).then((r) => r.ok)
    );
  }

  if (env.RESEND_API_KEY && env.LEAD_EMAIL_TO && env.LEAD_EMAIL_FROM) {
    jobs.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.LEAD_EMAIL_FROM,
          to: env.LEAD_EMAIL_TO,
          subject: `Заявка с сайта: ${lead.service ?? lead.task?.slice(0, 60) ?? lead.contact}`,
          text,
        }),
      }).then((r) => r.ok)
    );
  }

  if (jobs.length === 0) return json({ ok: false, error: 'not_configured' });

  const results = await Promise.allSettled(jobs);
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value);
  return json({ ok: delivered }, delivered ? 200 : 502);
};
