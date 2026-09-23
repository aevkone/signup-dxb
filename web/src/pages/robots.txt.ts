import type { APIRoute } from 'astro';

/**
 * robots.txt. На превью в GitHub Pages он бесполезен: файл читается только
 * из корня домена, а корень `aevkone.github.io` нам не принадлежит. Там от
 * индексации спасает мета-тег noindex в Base.astro — см. IS_PREVIEW.
 * На боевом домене здесь открывается индексация и указывается карта сайта.
 */
export const GET: APIRoute = ({ site }) => {
  const preview = (site?.host ?? '').endsWith('github.io');

  const body = preview
    ? ['# Тестовая версия на GitHub Pages — индексация закрыта.', 'User-agent: *', 'Disallow: /', ''].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
        '',
      ].join('\n');

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
