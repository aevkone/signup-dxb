import type { Lang } from '@/i18n';

type Step = { title: string; text: string };
type Qa = { q: string; a: string };

const PROCESS: Record<Lang, Step[]> = {
  ru: [
    { title: 'Заявка и бриф', text: 'Уточняем выставку, даты, площадь стенда и задачи участия.' },
    { title: 'Концепция и смета', text: 'Подбираем объём услуг так, чтобы он укладывался в ваш бюджет.' },
    { title: 'Договор и площадка', text: 'Бронируем место, ведём переговоры с организаторами павильона.' },
    { title: 'Производство и логистика', text: 'Изготавливаем конструкции и печать, везём всё на площадку.' },
    { title: 'Монтаж и работа стенда', text: 'Собираем стенд, выводим персонал, кейтеринг и шоу-программу.' },
    { title: 'Демонтаж и итоги', text: 'Разбираем и вывозим конструкции, передаём фото, видео и контакты.' },
  ],
  en: [
    { title: 'Request & brief', text: 'We clarify the exhibition, dates, stand size and your goals.' },
    { title: 'Concept & estimate', text: 'We shape the scope of services so it fits your budget.' },
    { title: 'Contract & space', text: 'We book the space and negotiate with the hall organisers.' },
    { title: 'Production & logistics', text: 'We build the structures and print, then deliver everything to the venue.' },
    { title: 'Build-up & show days', text: 'We assemble the stand and bring in staff, catering and the show programme.' },
    { title: 'Breakdown & wrap-up', text: 'We dismantle and remove the structures, then hand over photos, video and leads.' },
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
      a: 'Стоимость считаем под задачу: она зависит от площади стенда, состава блоков и сроков. Оставьте заявку — вернёмся с вариантами под ваш бюджет. Минимальный заказ — от 2 000 AED.',
    },
    {
      q: 'Выезд на замер платный?',
      a: 'Да, от 500 AED. Если после замера вы оформляете заказ, эта сумма входит в его стоимость.',
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
      q: 'Вы оформляете разрешения на вывески?',
      a: 'Оформление разрешений в стоимость не входит и обсуждается отдельно, под конкретный объект.',
    },
  ],
  en: [
    {
      q: 'Can I order just one block?',
      a: 'Yes. The full cycle is an option, not an obligation. Clients often take the stand and print, and handle staff and catering themselves.',
    },
    {
      q: 'How much does it cost?',
      a: 'We price each project individually: it depends on stand size, the blocks you choose and the timeline. Send a request and we’ll come back with options that fit your budget. Minimum order from AED 2,000.',
    },
    {
      q: 'Is the site survey paid?',
      a: 'Yes, from AED 500. If you place an order after the survey, this amount is credited towards it.',
    },
    {
      q: 'Which emirates do you cover?',
      a: 'Exhibitions — Dubai, Abu Dhabi, Sharjah and Ajman. Outdoor advertising production and installation — Dubai, Sharjah and Ajman.',
    },
    {
      q: 'Do you help with paying for exhibition participation?',
      a: 'Yes, under an agency agreement: we pay the organiser for your participation and give you the supporting documents.',
    },
    {
      q: 'Do you obtain signage permits?',
      a: 'Permits are not included in the price and are discussed separately for each site.',
    },
  ],
};

export const process = (lang: Lang) => PROCESS[lang];
export const faq = (lang: Lang) => FAQ[lang];
