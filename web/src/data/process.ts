import type { Lang } from '@/i18n';
import { LICENCE_VALID, local } from '@/consts';

type Step = { title: string; text: string };
/** link — ссылка в конце ответа (на странице; в микроразметку FAQ идёт только текст). */
type Qa = { q: string; a: string; link?: { href: string; label: string } };

const PROCESS: Record<Lang, Step[]> = {
  ru: [
    { title: 'Заявка и бриф', text: 'Уточняем выставку, даты, площадь стенда и задачи участия.' },
    { title: 'Концепция и смета', text: 'Подбираем объём услуг так, чтобы он укладывался в ваш бюджет.' },
    { title: 'Договор и площадка', text: 'Бронируем место, ведём переговоры с организаторами павильона.' },
    { title: 'Производство и логистика', text: 'Запускаем конструкции и печать в производство, везём всё на площадку.' },
    { title: 'Монтаж и работа стенда', text: 'Собираем и принимаем стенд, выводим персонал, кейтеринг и шоу-программу.' },
    { title: 'Демонтаж и итоги', text: 'Разбираем и вывозим конструкции, передаём фото, видео и таблицу контактов.' },
  ],
  en: [
    { title: 'Request & brief', text: 'We confirm the exhibition, dates, stand size and what you want from the show.' },
    { title: 'Concept & quote', text: 'We put together a scope of services that fits your budget.' },
    { title: 'Contract & space', text: 'We book your space and deal with the hall organisers.' },
    { title: 'Production & logistics', text: 'We send the structures and print into production, then deliver everything to the venue.' },
    { title: 'Build-up & show days', text: 'We build and inspect the stand, then bring in staff, catering and entertainment.' },
    { title: 'Breakdown & wrap-up', text: 'We dismantle and remove the stand, then hand over photos, video and a spreadsheet of the contacts collected.' },
  ],
};

const FAQ: Record<Lang, Qa[]> = {
  ru: [
    {
      q: 'Можно взять только один блок, без остального?',
      a: 'Да. Полный цикл — это возможность, а не обязательство. Часто берут стенд и печать, а персонал и питание закрывают сами.',
    },
    {
      q: 'Сколько стоит?',
      a: 'Стоимость считаем под задачу: она зависит от площади стенда, состава блоков и сроков. Оставьте заявку — вернёмся с вариантами и сметой. Минимальный заказ — от 2 000 AED.',
    },
    {
      q: 'Выезд на замер платный?',
      a: 'Да, от 500 AED. Если после замера вы оформляете заказ, эта сумма входит в его стоимость.',
    },
    {
      q: 'В каких эмиратах вы работаете?',
      a: 'Выставки — в Дубае, Абу-Даби, Шардже и Аджмане. Производство и монтаж наружной рекламы — в Дубае, Шардже и Аджмане.',
    },
    {
      q: 'Вы помогаете с оплатой участия в выставке?',
      a: 'Да, по агентскому договору: оплачиваем участие организатору и передаём вам закрывающие документы.',
    },
    {
      q: 'У нас нет компании в ОАЭ. Можно участвовать?',
      a: LICENCE_VALID
        ? // вернуть после продления лицензии
          'Да. Без торговой лицензии в ОАЭ участником не зарегистрироваться, поэтому оформляем стенд на нашу компанию, а на стенде — ваше имя и бренд.'
        : 'Схема участия зависит от выставки и организатора. Подскажем её в WhatsApp или на созвоне до того, как вы что-то оплатите.',
    },
    {
      q: 'С кем я заключаю договор?',
      a: `Исполнитель — ${local('ru').legalName}, Dubai Design District. Условия — в публичной оферте и в Расчёте под вашу задачу. Состав закрывающих документов зависит от выставки и вашей юрисдикции — уточним до оплаты.`,
      link: { href: '/offer/', label: 'Публичная оферта' },
    },
    {
      q: 'Можно ли продавать продукцию прямо на стенде?',
      a: 'Только если у вас компания, зарегистрированная в ОАЭ. Без неё продукцию можно показывать, но не продавать. Поможем открыть компанию: регистрация обычно занимает около недели, но закладывайте месяц.',
    },
    {
      q: 'За сколько до выставки к вам обращаться?',
      a: 'Лучше хотя бы за два месяца — этого хватает даже на большой стенд. Если времени меньше, напишите: скажем честно, что ещё успеваем.',
    },
    {
      q: 'Вы оформляете разрешения на вывески?',
      a: 'Оформление разрешений в стоимость не входит и обсуждается отдельно, под конкретный объект.',
    },
  ],
  en: [
    {
      q: 'Can I order just one service?',
      a: 'Yes. The full package is an option, not an obligation. Clients often order the stand and print, and arrange staff and catering themselves.',
    },
    {
      q: 'How much does it cost?',
      a: 'Every project is priced individually, depending on stand size, the services you choose and the timeline. Send a request and we’ll come back with options and a quote. Minimum order from AED 2,000.',
    },
    {
      q: 'Is there a fee for the site survey?',
      a: 'Yes, from AED 500. If you go ahead with an order, the fee is credited towards it.',
    },
    {
      q: 'Which emirates do you cover?',
      a: 'Exhibitions: Dubai, Abu Dhabi, Sharjah and Ajman. Signage production and installation: Dubai, Sharjah and Ajman.',
    },
    {
      q: 'Can you help pay the exhibition participation fee?',
      a: 'Yes, under an agency agreement: we pay the organiser on your behalf and hand over the supporting documents.',
    },
    {
      q: 'We don’t have a company in the UAE. Can we still exhibit?',
      a: LICENCE_VALID
        ? // вернуть после продления лицензии
          'Yes. You can’t register as an exhibitor without a UAE trade licence, so we register the stand under our company, while the stand carries your name and brand.'
        : 'The way you take part depends on the show and the organiser. We’ll explain it on WhatsApp or a call before you pay anything.',
    },
    {
      q: 'Who is my contract with?',
      a: `The contractor is ${local('en').legalName}, Dubai Design District. Terms are in the public offer and in the Estimate for your project. Closing documents depend on the show and your jurisdiction — we’ll confirm them before you pay.`,
      link: { href: '/offer/', label: 'Public offer' },
    },
    {
      q: 'Can we sell products on the stand?',
      a: 'Only with a company registered in the UAE. Without one you can display products but not sell them. We can help set up a company: registration usually takes about a week, but allow a month.',
    },
    {
      q: 'How far ahead should we contact you?',
      a: 'Ideally at least two months before the show — that is enough even for a large stand. If you have less time, get in touch and we’ll tell you honestly what is still possible.',
    },
    {
      q: 'Do you obtain signage permits?',
      a: 'Permits are not included in the price and are quoted separately for each site.',
    },
  ],
};

export const process = (lang: Lang) => PROCESS[lang];
export const faq = (lang: Lang) => FAQ[lang];
