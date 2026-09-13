# SIGNUP DXB — сайт

Организация участия в выставках в Дубае под ключ и собственное производство наружной рекламы.

Статический сайт на [Astro](https://astro.build), код в папке `web/`.

```bash
cd web
npm install
npm run dev      # разработка, http://localhost:4321
npm run build    # сборка в web/dist
```

- Контакты, реквизиты и условия — `web/src/consts.ts`
- Блоки выставок — `web/src/data/exhibitions.ts`
- Каталог производства — `web/src/data/production.ts`
- Дизайн-токены — `web/src/styles/global.css`

Выкладка — [docs/DEPLOY.md](docs/DEPLOY.md).
