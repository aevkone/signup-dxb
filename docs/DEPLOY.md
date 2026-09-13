# Выкладка сайта

## Сейчас: GitHub Pages — версия на согласование

Каждый push в ветку `main` собирает сайт и выкладывает его автоматически
(`.github/workflows/pages.yml`). Адрес: `https://<аккаунт>.github.io/<репозиторий>/`.

Один раз после создания репозитория: **Settings → Pages → Source: GitHub Actions**.

Ограничения тестовой версии:
- сайт закрыт от поисковиков (`noindex`);
- GitHub Pages не выполняет серверный код, поэтому заявки не уходят в Telegram
  и на почту — форма открывает WhatsApp с уже заполненной заявкой.

## После утверждения: боевой домен

Хостинг — Cloudflare Pages: там работает приём заявок (`web/functions/api/lead.ts`).

1. Аккаунт на https://dash.cloudflare.com (бесплатно).
2. Cloudflare → Workers & Pages → Create → Pages → подключить этот GitHub-репозиторий.
   - Build command: `npm ci && npm run build`
   - Root directory: `web`
   - Output directory: `dist`
   - Переменная `SITE_URL=https://<домен>` (`BASE_PATH` не задавать)
3. Custom domains → добавить купленный домен.
4. Перед запуском:
   - в `web/src/layouts/Base.astro` убрать `noindex`;
   - заполнить реквизиты и почту в `web/src/consts.ts`.

### Заявки в Telegram и на почту

Cloudflare → Pages → проект → Settings → Variables and Secrets:

| Переменная | Откуда взять |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Создать бота у @BotFather |
| `TELEGRAM_CHAT_ID` | Написать боту, открыть `https://api.telegram.org/bot<токен>/getUpdates` — поле `chat.id` |
| `RESEND_API_KEY` | resend.com → API Keys (нужен домен) |
| `LEAD_EMAIL_TO` | Почта, куда слать заявки |
| `LEAD_EMAIL_FROM` | Адрес отправителя на подтверждённом в Resend домене |
