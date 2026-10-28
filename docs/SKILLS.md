# Навыки (skills) и агенты для разработки сайта

Единый список того, что подключено у команды в Claude Code и чем пользоваться
на этом проекте. Обновлено 28.10.2026.

Навык вызывается словами в чате («проведи аудит дизайна», «сделай анимацию»)
или явно: `/имя-навыка`. Навыки проекта лежат в `.claude/skills/` этого
репозитория и подхватываются автоматически всеми, кто открыл репозиторий.

## 1. Навыки самого проекта (в репозитории)

| Навык | Откуда | Зачем на этом сайте |
|---|---|---|
| `landing-page-design` | [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills), MIT, добавлен 28.10.2026 | Стратегия конверсии (одно действие, доказательства рядом с обещанием, FAQ, финальный CTA), полный набор состояний элементов, чек-лист «перед запуском» (юр. ссылки, 404, фавикон, og-теги, alt), кривые анимации, блок-слоган с проявлением слов |

**Что из `landing-page-design` на этом сайте НЕ применяем** — ломает фирменный
стиль заказчика: обязательные шрифты Geist/Manrope/Poppins (у нас Montserrat
и рукописный Caveat), запрет курсива и градиентов в фонах, привязка всех
размеров к шкале Tailwind, тёмные фоны только из шести цветов, иконки только
Phosphor/Solar. Правило «реалистичные отзывы и имена» тоже не применяем: на
сайте нельзя выдумывать отзывы и клиентов — только реальные факты Кристины.

Компаньон-навык того же автора для доработки готовых сайтов —
`redesign-existing-projects` — уже установлен глобально (см. ниже).

## 2. Дизайн и интерфейс

| Навык | Когда звать |
|---|---|
| `impeccable` | Главный навык по интерфейсу: аудит, критика, полировка, типографика, цвет, отступы, состояния, адаптив, тексты интерфейса |
| `redesign-existing-projects` | Поднять готовые страницы до «премиум»: найти шаблонные приёмы и заменить |
| `web-design-guidelines` | Проверка по Web Interface Guidelines (доступность, формы, фокус, мобильные) |
| `ecc:make-interfaces-feel-better` | Мелкие детали, от которых интерфейс «ощущается» лучше: зоны нажатия, тени, переносы текста |
| `emil-design-eng` | Философия полировки интерфейса Эмиля Ковальски |
| `design-taste-frontend`, `design-taste-frontend-v1`, `gpt-taste`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `stitch-design-taste` | Задать направление визуала для новых страниц и лендингов |
| `ui-ux-pro-max:ui-ux-pro-max`, `ui-ux-pro-max:design`, `ui-ux-pro-max:design-system`, `ui-ux-pro-max:ui-styling`, `ui-ux-pro-max:brand`, `ui-ux-pro-max:banner-design`, `ui-ux-pro-max:slides` | Дизайн-система, токены, брендинг, баннеры |
| `typeface-design`, `brandkit`, `awesome-design-md`, `apple-design`, `opus-design`, `clay-design`, `jasper-design`, `writer-design`, `superside-design`, `airops-design`, `relevanceai-design`, `aicube-agent-design`, `ecc:design-system`, `ecc:frontend-design-direction`, `ecc:liquid-glass-design` | Готовые дизайн-системы и стилистики как образцы |
| `break-ui` | Проверить вёрстку худшими данными: длинные названия, пустые списки, огромные числа |
| `mobile-native` | Чтобы сайт на телефоне ощущался как приложение: 100vh, зум полей, залипший hover |
| `ecc:accessibility`, `ecc:frontend-a11y` | Доступность по WCAG 2.2 |
| `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `21st-*` | Вёрстка по картинке и готовые компоненты 21st.dev |
| `figma` | Работа с макетами Figma (нужна авторизация Figma) |

## 3. Анимация

| Навык | Когда звать |
|---|---|
| `animate` | Сделать новую анимацию правильно: нужна ли, кривая, длительность, прерывание |
| `review-animations`, `improve-animations`, `find-animation-opportunities` | Разбор существующей анимации, план улучшений, где анимации не хватает |
| `animation-performance` | Анимация дёргается, теряет кадры |
| `animation-vocabulary`, `ecc:motion-foundations`, `ecc:motion-patterns`, `ecc:motion-advanced` | Термины и паттерны движения |
| `img2threejs` | 3D-сцены на three.js (у нас 3D-стенд на первом экране) |

## 4. Проверка и качество

| Навык | Когда звать |
|---|---|
| `run` | Запустить сайт и убедиться, что правка работает |
| `playwright-cli`, `ecc:browser-qa`, `ecc:e2e-testing`, `ecc:click-path-audit` | Автотесты и проход по сценариям в браузере |
| `code-review`, `ecc:code-review`, `ecc:quality-gate`, `ecc:verification-loop` | Ревью изменений перед коммитом |
| `simplify` | Упростить код после правок |
| `ecc:seo` | Технический SEO: заголовки, разметка, sitemap, Core Web Vitals |
| `security-review`, `ecc:security-review`, `ecc:security-scan` | Безопасность (формы, заголовки, секреты) |
| `ecc:production-audit`, `ecc:canary-watch` | Аудит боевого сайта и наблюдение после выкладки |

## 5. Тексты, маркетинг, исследования

| Навык | Когда звать |
|---|---|
| `ecc:marketing-campaign`, `ecc:content-engine`, `ecc:article-writing`, `ecc:brand-voice`, `ecc:crosspost` | Тексты, посты, кампании |
| `ecc:market-research`, `anthropic-skills:deep-research`, `ecc:deep-research` | Исследование рынка выставок и подрядчиков |
| `ecc:council` | «Совет директоров»: несколько точек зрения на решение |
| `content-system-georgii-rivera:*` (`hook`, `posts`, `reels`, `scout`, `multiply`, `lead-magnet`, `youtube-pro`, `director`, `antidetector`, `skill-forge`) | Контент для соцсетей клиента |

## 6. Документы, медиа, данные

| Навык | Когда звать |
|---|---|
| `anthropic-skills:pdf`, `anthropic-skills:docx`, `anthropic-skills:xlsx`, `anthropic-skills:pptx` | Прайсы, договоры, презентации в файлах |
| `anthropic-skills:docs`, `anthropic-skills:google-workspace`, `ecc:google-workspace-ops` | Google Документы и Диск |
| `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`, `general-video`, `music-to-video`, `talking-head-recut`, `add-sfx`, `remotion-*`, `ecc:video-editing`, `ecc:manim-video` | Видео для сайта и соцсетей |
| `dataviz`, `ecc:dashboard-builder` | Графики и дашборды |

## 7. Работа с кодом и процессом

| Навык | Когда звать |
|---|---|
| `ecc:frontend-patterns`, `ecc:coding-standards`, `ecc:vite-patterns` | Паттерны фронтенда (Astro собирается на Vite) |
| `ecc:git-workflow`, `ecc:github-ops`, `ecc:pr`, `ecc:prp-commit` | Git, коммиты, PR |
| `ecc:plan`, `ecc:feature-dev`, `ecc:blueprint`, `claude-mem:make-plan` | Планирование крупной правки |
| `ecc:update-docs`, `ecc:docs-governance` | Документация |
| `workflow-authoring` | Многоагентные процессы (как «50 пользователей + совет директоров») |
| `update-config`, `fewer-permission-prompts`, `keybindings-help` | Настройка Claude Code |
| `schedule`, `loop` | Повторяющиеся задачи по расписанию |
| `find-skills`, `anthropic-skills:skill-creator`, `ecc:skill-create` | Найти или написать новый навык |

Полный список установленных навыков ECC (около 300, в основном для других
языков и стеков — Go, Rust, Java, Django, Laravel и т.д.) показывает
`/ecc:ecc-guide`; на этом проекте они не нужны.

## 8. Агенты (Agent tool)

| Агент | Зачем |
|---|---|
| `Explore` | Быстрый поиск по коду без правок |
| `Plan`, `ecc:planner`, `ecc:architect` | План реализации |
| `ecc:code-reviewer`, `ecc:typescript-reviewer`, `ecc:security-reviewer` | Ревью TypeScript/Astro-кода |
| `ecc:a11y-architect` | Доступность |
| `ecc:seo-specialist` | SEO-аудит |
| `ecc:performance-optimizer` | Скорость, вес страниц, 3D-сцена |
| `ecc:e2e-runner`, `ecc:gan-evaluator` | Прогон сценариев в браузере |
| `ecc:marketing-agent` | Лендинги, тексты, кампании |
| `ecc:build-error-resolver` | Сборка упала |

## 9. Скрипты проекта (не навыки, но под рукой)

Из папки `web`:

| Команда | Что делает |
|---|---|
| `npm run dev -- --host 127.0.0.1` | Сайт для разработки на http://127.0.0.1:4321 |
| `npm run build` | preflight → сборка → проверка ссылок |
| `npm run og` | Картинки для соцсетей (нужен Chrome) |
| `node scripts/logo.mjs && node scripts/logo-webp.mjs` | Пересобрать логотип |
| `node scripts/stand-stills.mjs` | Переснять кадры 3D-стенда (нужен запущенный dev-сервер) |
