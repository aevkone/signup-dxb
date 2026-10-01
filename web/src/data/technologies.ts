/**
 * Материалы и технологии.
 * Источник — разборы технологий в теме «Полезные материалы» группы проекта
 * (21.09–30.09.2026), переписаны для клиента. Иллюстрации — фото из
 * data/works.ts; снимки из интернета с чужими брендами не используем.
 */
import type { Lang } from '@/i18n';

export type TechItem = { title: string; text: string };
export type TechSection = {
  id: string;
  title: string;
  lead?: string;
  items: TechItem[];
  /** id фото из data/works.ts. */
  photos?: string[];
};
export type TechNote = { title: string; text: string };

const RU: TechSection[] = [
  {
    id: 'films',
    title: 'Плёнки',
    lead: 'Большая часть оформления — это плёнка. Любая плёнка бывает матовой или глянцевой.',
    items: [
      { title: 'Полноцветная печать', text: 'Изображение печатается на белой плёнке и клеится на поверхность. Сверху — прозрачная ламинация, чтобы печать не стиралась и не царапалась при монтаже и в работе.' },
      { title: 'Плоттерная резка', text: 'Цветная плёнка Oracal вырезается по контуру, без фона. Так делают режим работы на стеклянной двери, наклейки и брендирование автомобилей. Цвет заводской: ярче печати и не выгорает на солнце. Золото и серебро получаются только так. Для подбора цвета — палитра Oracal 641, её часто указывают в брендбуках.' },
      { title: 'Светорассеивающая плёнка', text: 'Oracal 8500 и 8100 — для световых букв и коробов: с подсветкой светится сочно и равномерно. Учтите: серебро с подсветкой выглядит почти белым, золото — жёлтым, и многие цвета днём и ночью смотрятся по-разному.' },
      { title: 'Специальные плёнки', text: 'Витражная — цветная полупрозрачная. Матовая — для витрин и стеклянных перегородок. Маркерная — на ней можно писать. Фольгированная — зеркальное золото и серебро.' },
    ],
    photos: ['19', '67'],
  },
  {
    id: 'rigid',
    title: 'Пластик, оргстекло, поликарбонат',
    lead: 'Твёрдые материалы — основа вывесок, табличек, объёмных букв и декоративных элементов.',
    items: [
      { title: 'Материалы', text: 'Пластик — белый и цветной. Оргстекло — прозрачное, молочное и цветное. Поликарбонат — прозрачный и молочный. Стандартная толщина 3, 6 и 10 мм; пластик для гравировки «под золото» и «под серебро» — 1,5 мм.' },
      { title: 'Плоские вывески и таблички', text: 'Печать на плёнке с ламинацией наклеивается на пластик, вырезанный по форме. Альтернатива — УФ-печать прямо по пластику: меньше выгорает, но в 2–3 раза дороже.' },
      { title: 'Объёмные буквы и логотипы', text: 'Фрезеруются из пластика или оргстекла, затем красятся, оклеиваются плёнкой или сразу делаются из цветного материала. Пластик даёт матовую поверхность, оргстекло — глянцевую. Буквы «под металл» вырезаются из пластика для гравировки.' },
      { title: 'Крепление', text: 'На стену, на подложку или на дистанционные держатели, если нужен отступ от стены. Крепёж обычно скрытый: саморезы закрываются буквой сверху.' },
      { title: 'Интерьер', text: 'Пластиком брендируют ресепшн и мебель, из него делают таблички с гравировкой.' },
    ],
    photos: ['06', '07', '14', '41'],
  },
  {
    id: 'composite',
    title: 'Алюминиевый композит',
    items: [
      { title: 'Что это', text: 'Два листа алюминия по 0,1 мм и пластик между ними, общая толщина 3 мм. Листы 1,5 × 4 м и 1,22 × 4 м, цвет — заводской RAL.' },
      { title: 'Где применяется', text: 'Плоские вывески, фасадные панели, подложки и короба. Композит гнётся без трещин там, где пластик сломался бы. Из него собирают короба глубиной от 2 см, обычно 60–90 мм.' },
    ],
    photos: ['27', '30'],
  },
  {
    id: 'letters',
    title: 'Несветовые объёмные буквы',
    items: [
      { title: 'Из пеноплекса', text: 'Буквы толщиной 30 или 50 мм вырезаются, красятся и монтируются. Днём не отличаются от световых, а стоят заметно дешевле — хороший выбор для выставок и торговых центров.' },
      { title: 'Дублёр из пластика', text: 'На лицевую сторону клеим пластик 3 мм: поверхность получается идеально ровной, а многоцветный рисунок печатается на плёнке и наклеивается на пластик.' },
      { title: 'Монтаж', text: 'На стену, на подложку из пластика или композита либо на металлическую раму с дублёром из пластика.' },
    ],
    photos: ['32', '56'],
  },
  {
    id: 'illuminated',
    title: 'Световая реклама',
    items: [
      { title: 'Гибкий неон', text: 'Цена зависит от количества и мелкости элементов. Неон собирается на подложке из оргстекла 5 мм — на ней соединяются провода между буквами. Крепится на дистанционные держатели или подвешивается.' },
      { title: 'Буквы с фронтальной подсветкой', text: 'Самый распространённый вариант. Светится лицевая часть, борта — нет; светящиеся борта возможны, но в 3–4 раза дороже при почти том же виде. Состав прописываем в договоре: лицо — оргстекло 3 мм, цвет — плёнка Oracal, борт — пластик 3 мм, задник — пластик 6 мм, подсветка — светодиоды тёплые, нейтральные или холодные.' },
      { title: 'Монтаж световых букв', text: 'Провода прячутся за отступом от стены. Три варианта: короб-подложка из композита глубиной 3–4 см; металлоконструкция в цвет фасада — для улицы; прямо на стену, когда соединения уходят за стену, — чаще в торговых центрах и фотозонах.' },
      { title: 'Контражурная подсветка', text: 'Лицевая часть не светится, свет уходит в стену и создаёт ореол. Нужен светлый фон: если стена тёмная, под буквы клеим белую плёнку чуть шире контура. Лучше всего смотрится в интерьере.' },
      { title: 'Таблички с подсветкой', text: 'На оргстекле — если нужен прозрачный фон, на пластике — если цветной. Недорого, эффектно и просто в монтаже: хорошо подходят для выставок.' },
      { title: 'Световая консоль', text: 'Небольшая вывеска перпендикулярно входу, стенду или отделу в торговом центре: световая или нет, плоская или объёмная, одно- или двусторонняя. Работает в потоке людей, потому что стоит в другой плоскости, и выручает, когда основные буквы ради бюджета делают без подсветки.' },
      { title: 'Световой короб', text: 'Массивнее букв, но нередко дешевле. Короб из профиля с оргстеклом светится всей поверхностью. Короб из композита с инкрустацией светится только вырезанными буквами и ночью выглядит как отдельные буквы; мелкие надписи, в которые не помещается диод, делаются только так.' },
    ],
    photos: ['24', '28', '20', '17', '50', '03'],
  },
  {
    id: 'expo',
    title: 'Выставочные конструкции',
    items: [
      { title: 'Пресс-вол', text: 'Каркас из джокерной трубы, стандарт — 3000 × 2000 мм. Выше 3 метров — через специальные соединители.' },
      { title: 'Тритикс', text: 'В 3–4 раза дороже пресс-вола, зато устойчивее: крепления скрыты, на лицевой стороне нет люверсов.' },
      { title: 'Фотозона из бруска', text: 'Не зависит от размеров стандартных конструкций и иногда удобнее в монтаже.' },
      { title: 'X-баннер', text: 'Лёгкая переносная конструкция: собирается за 5 минут, полотно проще заменить самостоятельно, чем в ролл-апе.' },
      { title: 'Ролл-ап', text: 'Мобильная конструкция в чехле, сборка — 5 минут.' },
    ],
  },
];

const EN: TechSection[] = [
  {
    id: 'films',
    title: 'Vinyl films',
    lead: 'Most branding is film. Every film comes in matt or gloss.',
    items: [
      { title: 'Full-colour print', text: 'The image is printed on white film and applied to the surface. A clear laminate on top keeps the print from rubbing off or scratching during installation and use.' },
      { title: 'Plotter cutting', text: 'Coloured Oracal film is cut along the outline, with no background. Opening hours on glass doors, stickers and vehicle branding are made this way. The colour is factory-made: brighter than print and it does not fade in the sun. Gold and silver can only be done like this. For colour matching we use the Oracal 641 palette, which brand books often specify.' },
      { title: 'Translucent film', text: 'Oracal 8500 and 8100 — for illuminated letters and lightboxes: backlit, they glow rich and even. Note that backlit silver looks almost white, gold looks yellow, and many colours look different by day and by night.' },
      { title: 'Special films', text: 'Stained-glass — coloured and translucent. Frosted — for windows and glass partitions. Whiteboard — you can write on it. Foil — mirror gold and silver.' },
    ],
    photos: ['19', '67'],
  },
  {
    id: 'rigid',
    title: 'PVC, acrylic, polycarbonate',
    lead: 'Rigid materials are the base for signs, plaques, built-up letters and decorative elements.',
    items: [
      { title: 'Materials', text: 'PVC — white and coloured. Acrylic — clear, opal and coloured. Polycarbonate — clear and opal. Standard thicknesses are 3, 6 and 10 mm; gold- and silver-effect engraving plastic is 1.5 mm.' },
      { title: 'Flat signs and plaques', text: 'Laminated printed film is applied to PVC cut to shape. The alternative is UV printing straight onto the PVC: it fades less but costs 2–3 times more.' },
      { title: 'Built-up letters and logos', text: 'Routed from PVC or acrylic, then painted, wrapped in film or made from coloured material. PVC gives a matt finish, acrylic a gloss one. Metal-effect letters are cut from engraving plastic.' },
      { title: 'Fixing', text: 'To the wall, to a backing panel or on stand-off fixings when the sign needs to sit off the wall. Fixings are usually hidden: the screws are covered by the letter on top.' },
      { title: 'Interiors', text: 'PVC is used to brand reception desks and furniture, and for engraved plaques.' },
    ],
    photos: ['06', '07', '14', '41'],
  },
  {
    id: 'composite',
    title: 'Aluminium composite',
    items: [
      { title: 'What it is', text: 'Two 0.1 mm aluminium sheets with plastic between them, 3 mm in total. Sheets are 1.5 × 4 m and 1.22 × 4 m in factory RAL colours.' },
      { title: 'Where it is used', text: 'Flat signs, facade panels, backing panels and boxes. Composite bends without cracking where PVC would break. Boxes start at 2 cm deep, typically 60–90 mm.' },
    ],
    photos: ['27', '30'],
  },
  {
    id: 'letters',
    title: 'Non-illuminated built-up letters',
    items: [
      { title: 'Foam letters', text: 'Cut from 30 or 50 mm foam board, painted and installed. By day they look just like illuminated letters but cost considerably less — a good choice for exhibitions and malls.' },
      { title: 'PVC facing', text: 'We bond 3 mm PVC to the face: the surface comes out perfectly even, and multi-colour artwork is printed on film and applied to the PVC.' },
      { title: 'Installation', text: 'To the wall, to a PVC or composite backing panel, or to a metal frame with a PVC facing.' },
    ],
    photos: ['32', '56'],
  },
  {
    id: 'illuminated',
    title: 'Illuminated signage',
    items: [
      { title: 'Flexible neon', text: 'The price depends on how many elements there are and how small they are. Neon is mounted on a 5 mm acrylic backing that carries the wiring between letters, and fixed on stand-offs or hung.' },
      { title: 'Front-lit letters', text: 'The most common option. The face lights up, the sides do not; illuminated sides are possible but cost 3–4 times more for almost the same look. We specify the build in the contract: 3 mm acrylic face, Oracal film colour, 3 mm PVC returns, 6 mm PVC back, warm, neutral or cool LEDs.' },
      { title: 'Mounting illuminated letters', text: 'The wiring hides behind a gap from the wall. Three options: a composite backing box 3–4 cm deep; a metal frame in the facade colour, for outdoors; or straight onto the wall with the connections run through it — common in malls and photo zones.' },
      { title: 'Halo lighting', text: 'The face stays dark and the light falls on the wall behind, creating a halo. It needs a light background: on a dark wall we apply white film slightly larger than the outline. Works best indoors.' },
      { title: 'Backlit plaques', text: 'On acrylic for a clear background, on PVC for a coloured one. Affordable, striking and easy to install — well suited to exhibitions.' },
      { title: 'Projecting sign', text: 'A small sign perpendicular to an entrance, stand or mall unit: lit or unlit, flat or 3D, single- or double-sided. It catches passing footfall because it sits in a different plane, and helps when the main letters are left unlit to stay within budget.' },
      { title: 'Lightbox', text: 'Bulkier than letters but often cheaper. A profile box with an acrylic face glows across the whole surface. A composite box with inlaid lettering lights only the cut-out letters and reads as separate letters at night; small lettering too tight for an LED can only be done this way.' },
    ],
    photos: ['24', '28', '20', '17', '50', '03'],
  },
  {
    id: 'expo',
    title: 'Exhibition structures',
    items: [
      { title: 'Press wall', text: 'A pop-up tube frame, standard size 3000 × 2000 mm. Above 3 metres, special connectors are used.' },
      { title: 'Tension fabric frame', text: 'Costs 3–4 times more than a press wall but is more stable: fixings are hidden and there are no eyelets on the face.' },
      { title: 'Timber photo zone', text: 'Not tied to the sizes of standard structures and sometimes easier to install.' },
      { title: 'X-banner', text: 'A light portable stand: assembles in 5 minutes, and the graphic is easier to swap yourself than on a roll-up.' },
      { title: 'Roll-up', text: 'A mobile stand in a carry case, set up in 5 minutes.' },
    ],
  },
];

const NOTE: Record<Lang, TechNote> = {
  ru: {
    title: 'Важно для ОАЭ',
    text: 'Жаркий климат меняет выбор материалов. Тонкий пластик 3 мм на сильном солнце «ведёт волной», поэтому на улице используем пластик от 6 мм и алюминиевый композит. В короба всегда вшиваем металлическую раму, чтобы конструкцию не повело от жары. Внутри помещений таких ограничений нет.',
  },
  en: {
    title: 'Why it matters in the UAE',
    text: 'The hot climate changes material choices. Thin 3 mm PVC warps in strong sun, so outdoors we use PVC from 6 mm and aluminium composite. Boxes always get a built-in metal frame so heat does not distort them. Indoors there are no such limits.',
  },
};

export const techSections = (lang: Lang): TechSection[] => (lang === 'en' ? EN : RU);
export const uaeNote = (lang: Lang): TechNote => NOTE[lang];
