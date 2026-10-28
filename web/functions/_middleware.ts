/**
 * Один адрес сайта: www.signeddxb.com, старый signupdxb.com и любые другие домены,
 * подключённые к проекту Cloudflare Pages, отвечают 301 на ту же страницу signeddxb.com.
 * Работает, только если домен добавлен в Custom domains проекта (DNS — в Cloudflare).
 * Превью *.pages.dev и локальный запуск не трогаем.
 */
const MAIN = 'signeddxb.com';

type Context = { request: Request; next: () => Promise<Response> };

export const onRequest = async ({ request, next }: Context): Promise<Response> => {
  const url = new URL(request.url);
  const host = url.hostname;
  if (host === MAIN || host.endsWith('.pages.dev') || host === 'localhost' || host === '127.0.0.1') return next();
  url.hostname = MAIN;
  url.protocol = 'https:';
  url.port = '';
  return Response.redirect(url.toString(), 301);
};
