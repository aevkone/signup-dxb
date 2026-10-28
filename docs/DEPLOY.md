# Выкладка сайта

Боевой адрес — **https://signeddxb.com** (Cloudflare Pages). Обновлено 28.10.2026.

## Боевой сайт: Cloudflare Pages

Cloudflare → Workers & Pages → проект сайта:

- Build command: `npm ci && npm run build`
- Root directory: `web`
- Output directory: `dist`
- Переменная `SITE_URL=https://signeddxb.com` (`BASE_PATH` не задавать)

Если проект подключён к репозиторию `aevkone/signup-dxb`, каждый push в `main`
выкладывается сам. Если сайт выкладывали вручную (Direct Upload / wrangler),
после push нужно выложить заново — иначе на signeddxb.com останется старая версия.

`SITE_URL` не адрес `github.io` → `noindex` не выводится, `robots.txt`
открывает индексацию и указывает на карту сайта.

### Один адрес сайта

`web/functions/_middleware.ts` отвечает 301 на ту же страницу
`https://signeddxb.com` для любого другого домена, подключённого к проекту:
`www.signeddxb.com`, старый `signupdxb.com` и т.д. Чтобы это заработало:

1. Cloudflare → проект → **Custom domains** → добавить `www.signeddxb.com`
   (и `signupdxb.com` с `www`, когда его DNS переедет в Cloudflare).
2. Превью `*.pages.dev` и локальный запуск не переадресуются.

### Заявки

Сервера заявок нет: форма и расчёт стоимости открывают WhatsApp Кристины
(`CONTACTS.whatsapp` в `web/src/consts.ts`) с уже заполненной заявкой.
Ничего настраивать в Cloudflare не нужно.

### Почта

На сайте указана `info@signeddxb.com` (`CONTACTS.email`). Чтобы она работала,
у домена должны быть MX-записи почтового сервиса (например, Google Workspace)
и SPF — добавляются в DNS домена в Cloudflare.

## Сборка не даст выложить незаполненный сайт

`npm run build` состоит из трёх шагов:

```
node scripts/preflight.mjs   → проверка данных и файлов
astro build                  → сборка
node scripts/check-links.mjs → проверка внутренних ссылок
```

`preflight` на боевом домене **прерывает сборку**, если в `web/src/consts.ts`
остались заглушки в квадратных скобках или нет почты. Истёкшую лицензию он
только отмечает предупреждением: её номер сайт сам не показывает
(`LICENCE_VALID` в `consts.ts`).

`check-links` падает, если в собранном сайте появилась ссылка в никуда.

Проверить готовность, ничего не собирая:

```bash
cd web && SITE_URL=https://signeddxb.com npm run preflight
```

### Новая лицензия

В `web/src/consts.ts`, в обоих языковых блоках: `legalName`, `licence`,
`licenceActivity`, `address` — как в документе; дата окончания —
в `LICENCE_EXPIRES`. Значения выводятся в подвале, на странице контактов
и в юридических документах (`web/src/data/legal.ts`).

## GitHub Pages: тестовая копия закрыта

С 28.10.2026 `.github/workflows/pages.yml` выкладывает на
https://aevkone.github.io/signup-dxb/ только переадресацию
(`.github/pages-redirect/`): любая старая ссылка ведёт на ту же страницу
signeddxb.com. Чтобы выключить адрес совсем — Settings → Pages → Source → None.
