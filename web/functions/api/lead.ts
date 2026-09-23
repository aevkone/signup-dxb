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
  lang: 'Язык сайта',
  page: 'Страница',
  file: 'Вложение',
};

/** Resend ждёт вложение строкой base64. */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Предел на вложение — столько же, сколько проверяет форма. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const type = request.headers.get('content-type') ?? '';
  let data: Record<string, unknown> = {};
  let file: File | null = null;

  if (type.includes('multipart/form-data')) {
    try {
      const form = await request.formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') data[k] = v;
        else if (k === 'file') file = v as File;
      }
    } catch {
      return json({ ok: false, error: 'bad_form' }, 400);
    }
    if (file && file.size > MAX_FILE_BYTES) return json({ ok: false, error: 'file_too_big' }, 413);
  } else {
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'bad_json' }, 400);
    }
  }

  const lead: Record<string, string> = {};
  for (const key of Object.keys(LABELS)) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) lead[key] = v.trim().slice(0, 2000);
  }
  if (!lead.contact) return json({ ok: false, error: 'no_contact' }, 422);
  if (file) lead.file = `${file.name} (${Math.round(file.size / 1024)} КБ)`;

  const text = ['Заявка с сайта SIGNUP DXB', ...Object.entries(lead).map(([k, v]) => `${LABELS[k]}: ${v}`)].join('\n');

  const jobs: Promise<boolean>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const api = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
    if (file) {
      // С макетом отправляем документ: подпись у Телеграма ограничена 1024
      // символами, остаток заявки уходит отдельным сообщением.
      const fd = new FormData();
      fd.append('chat_id', env.TELEGRAM_CHAT_ID);
      fd.append('document', file, file.name);
      fd.append('caption', text.slice(0, 1024));
      jobs.push(fetch(`${api}/sendDocument`, { method: 'POST', body: fd }).then((r) => r.ok));
      if (text.length > 1024) {
        jobs.push(
          fetch(`${api}/sendMessage`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
          }).then((r) => r.ok)
        );
      }
    } else {
      jobs.push(
        fetch(`${api}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
        }).then((r) => r.ok)
      );
    }
  }

  if (env.RESEND_API_KEY && env.LEAD_EMAIL_TO && env.LEAD_EMAIL_FROM) {
    jobs.push(
      (async () => {
        const body: Record<string, unknown> = {
          from: env.LEAD_EMAIL_FROM,
          to: env.LEAD_EMAIL_TO,
          subject: `Заявка с сайта: ${lead.service ?? lead.task?.slice(0, 60) ?? lead.contact}`,
          text,
        };
        if (file) {
          body.attachments = [{ filename: file.name, content: toBase64(await file.arrayBuffer()) }];
        }
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        return r.ok;
      })()
    );
  }

  if (jobs.length === 0) return json({ ok: false, error: 'not_configured' });

  const results = await Promise.allSettled(jobs);
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value);
  return json({ ok: delivered }, delivered ? 200 : 502);
};
