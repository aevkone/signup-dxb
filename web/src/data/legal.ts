/**
 * Юридические документы сайта: политика конфиденциальности, согласие на обработку
 * данных, пользовательское соглашение и публичная оферта. RU и EN.
 * Реквизиты — из consts.ts: номер лицензии подставляется, только пока она действует.
 * Составлено 28.10.2026 по фактической работе сайта (заявки — в WhatsApp, без базы
 * и аналитики). Перед изменением способа приёма заявок или подключением
 * аналитики — обновить разделы «Как заявка доходит до нас» и «Cookies».
 */
import type { Lang } from '@/i18n';
import { CONTACTS, LICENCE_VALID, SITE_NAME, local } from '@/consts';

export type LegalSlug = 'privacy' | 'consent' | 'terms' | 'offer';
export type Section = { h?: string; p: string[] };
export type LegalDoc = { title: string; description: string; sections: Section[] };

export const LEGAL_SLUGS: LegalSlug[] = ['privacy', 'consent', 'terms', 'offer'];
/** Дата редакции всех документов. */
export const LEGAL_UPDATED = '2026-10-28';

const SITE = 'signeddxb.com';

function docs(lang: Lang): Record<LegalSlug, LegalDoc> {
  const L = local(lang);
  const lic = LICENCE_VALID ? (lang === 'ru' ? `, лицензия ${L.licence}` : `, licence ${L.licence}`) : '';
  const who = `${L.legalName}${lic}, ${L.address}`;
  // Почту упоминаем, только когда она настроена (CONTACTS.email не пустой); иначе — WhatsApp и телефон.
  const mail = CONTACTS.email;
  const reach =
    lang === 'ru'
      ? `телефон и WhatsApp ${CONTACTS.phone}${mail ? `, почта ${mail}` : ''}`
      : `phone and WhatsApp ${CONTACTS.phone}${mail ? `, email ${mail}` : ''}`;
  /** «Напишите на … или в WhatsApp …» — без почты остаётся только WhatsApp. */
  const writeTo =
    lang === 'ru'
      ? mail
        ? `на ${mail} или в WhatsApp ${CONTACTS.phone}`
        : `в WhatsApp ${CONTACTS.phone}`
      : mail
        ? `to ${mail} or on WhatsApp ${CONTACTS.phone}`
        : `on WhatsApp ${CONTACTS.phone}`;

  if (lang === 'en')
    return {
      privacy: {
        title: 'Privacy policy',
        description: `How ${SITE_NAME} handles personal data from the website ${SITE}: what we receive, why, how long we keep it and how to delete it.`,
        sections: [
          { p: [`This policy applies to the website ${SITE} (the “Website”). The data controller is ${who} (“we”). Contact: ${reach}.`] },
          {
            h: '1. What data we receive',
            p: [
              'Only what you enter yourself in the request form or the cost configurator: your name, a way to reach you (phone, WhatsApp, email or Telegram username), a description of your request and the details of the service you chose (exhibition, dates, stand area, budget).',
              'The Website has no user accounts and does not ask for passport, payment or other sensitive data. Please do not include such data in your request.',
            ],
          },
          {
            h: '2. How your request reaches us',
            p: [
              'When you press the send button, the Website opens WhatsApp with your request already filled in. The message is sent only when you tap Send in WhatsApp yourself. The Website keeps no database of requests and does not send your data anywhere else.',
              `From then on the conversation is handled in WhatsApp (WhatsApp LLC / Meta Platforms), whose own privacy policy applies to the message. ${mail ? 'You can also write to us by email or call us.' : `You can also call us on ${CONTACTS.phone}.`}`,
            ],
          },
          {
            h: '3. Why we use the data',
            p: [
              'To reply to you, clarify the request, prepare a quote or proposal and, if we agree, provide the service and keep the related records.',
              'We do not use your data for mailings or advertising and do not sell it or share it with third parties for their marketing.',
            ],
          },
          {
            h: '4. Legal basis',
            p: [
              'Your consent given when sending the request, and the steps needed to prepare and perform a contract at your request. We process data in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data.',
            ],
          },
          {
            h: '5. Who else may see the data',
            p: [
              'Only those who help us carry out your order and only to the extent required: exhibition organisers and venues, production and logistics contractors, stand staff and concierge partners. Also government authorities where the law requires it.',
              'Technical providers: Cloudflare (website hosting and protection; it may record your IP address and browser type in server logs) and the email provider that hosts our mailbox. Their servers may be located outside the UAE.',
            ],
          },
          {
            h: '6. Cookies and analytics',
            p: [
              'The Website does not use advertising or analytics cookies and does not track you across sites. The hosting provider may set strictly necessary technical cookies to protect the Website from attacks. If we add analytics, we will update this policy first.',
            ],
          },
          {
            h: '7. How long we keep it',
            p: [
              'Requests that did not lead to an order — up to 12 months after our last contact. Data about orders — for as long as UAE accounting and tax law requires.',
            ],
          },
          {
            h: '8. Your rights',
            p: [
              `You can ask what data we hold about you, ask us to correct or delete it, restrict its use or withdraw your consent. Write ${writeTo} — we will reply within 30 days. You can also complain to the UAE Data Office.`,
            ],
          },
          {
            h: '9. Children',
            p: ['The Website is intended for businesses and is not aimed at people under 18. We do not knowingly collect their data.'],
          },
          {
            h: '10. Changes',
            p: ['We may update this policy. The current version is always on this page, with the date of the latest revision.'],
          },
        ],
      },
      consent: {
        title: 'Consent to personal data processing',
        description: `The consent you give ${SITE_NAME} when sending a request on ${SITE}.`,
        sections: [
          {
            p: [
              `By sending a request on the website ${SITE} (the form, the cost configurator or a WhatsApp button), I freely and knowingly give my consent to ${who} (the “Controller”) to process my personal data on the following terms.`,
            ],
          },
          { h: '1. Data', p: ['Name; phone number, WhatsApp, email or Telegram username; the description of my request and the details I chose (service, exhibition or venue, dates, stand area, budget).'] },
          {
            h: '2. Purposes',
            p: ['To reply to my request, clarify it, prepare a quote or commercial proposal, and to enter into and perform a contract if one is concluded.'],
          },
          {
            h: '3. Actions',
            p: [
              'Collection, recording, organisation, storage, clarification, use, transfer (to the contractors needed to fulfil my order — exhibition organisers, production, logistics, staff — and to the technical providers named in the privacy policy), blocking, deletion and destruction, with or without automated tools.',
            ],
          },
          {
            h: '4. Cross-border transfer',
            p: ['I understand that the Controller is located in the United Arab Emirates and that my data will be processed there and may be transferred to providers whose servers are in other countries.'],
          },
          {
            h: '5. Term and withdrawal',
            p: [
              `The consent is valid until the purposes are achieved or for 12 months from my last contact with the Controller, whichever comes first, unless the law requires longer storage. I may withdraw it at any time by writing ${writeTo}.`,
            ],
          },
          { h: '6. Privacy policy', p: ['I have read the privacy policy published on the Website.'] },
        ],
      },
      terms: {
        title: 'Terms of use',
        description: `Rules for using the ${SITE_NAME} website: price information, materials, links and liability.`,
        sections: [
          { p: [`These terms govern the use of the website ${SITE} (the “Website”), owned by ${who} (the “Owner”). By using the Website you accept these terms.`] },
          {
            h: '1. Information on the Website',
            p: [
              'The Website describes our services. Prices are indicative, in UAE dirhams, excluding VAT: the exact cost depends on sizes, materials, the venue and deadlines and is fixed in a quote or commercial proposal.',
              'The general terms of our services are set out in the public offer. A specific scope, price and timeline become binding only after you accept a quote or pay an invoice.',
              '3D stand images are visualisations, not photos of completed projects. Photos of our work are marked as such.',
            ],
          },
          {
            h: '2. Materials',
            p: [
              'Texts, design, logo, visualisations and photos on the Website belong to the Owner or are used with the rights holders’ permission. You may quote them with a link to the Website; any other use requires our written consent.',
            ],
          },
          {
            h: '3. Links to other services',
            p: ['The Website links to WhatsApp, Instagram and other third-party services. They operate under their own rules, and we are not responsible for their content or availability.'],
          },
          {
            h: '4. Liability',
            p: [
              'The Website is provided as is. We try to keep the information accurate but do not guarantee it is complete or error-free, and we are not liable for decisions made solely on the basis of the Website without a quote. Exhibition dates, venue rules and organiser fees are set by the organisers and may change.',
            ],
          },
          { h: '5. Personal data', p: ['Data you send us is handled according to the privacy policy.'] },
          {
            h: '6. Law and disputes',
            p: ['These terms are governed by the laws of the Emirate of Dubai and the UAE. Disputes are resolved through negotiation, and failing that, by the courts of Dubai.'],
          },
          { h: '7. Changes', p: ['We may update these terms; the current version is published on this page.'] },
        ],
      },
      offer: {
        title: 'Public offer',
        description: `General terms on which ${SITE_NAME} provides exhibition, production and related services.`,
        sections: [
          {
            p: [
              `This document is an offer by ${who} (the “Contractor”) to enter into a services agreement with a company or individual entrepreneur (the “Client”) on the terms below. Contact: ${reach}.`,
            ],
          },
          {
            h: '1. Definitions',
            p: [
              'Quote — a commercial proposal or invoice that the Contractor sends the Client, specifying the services, scope, price, timeline and payment schedule. The Quote forms an integral part of the agreement.',
              `Acceptance — the Client’s written confirmation of the Quote (including ${mail ? 'by email or on WhatsApp' : 'on WhatsApp'}) or payment of the invoice in full or in part. From acceptance, the agreement is concluded on the terms of this offer and the Quote.`,
            ],
          },
          {
            h: '2. Subject',
            p: [
              'The Contractor provides the services listed in the Quote: organising participation in exhibitions in the UAE (stand design and build, print, staff, catering, logistics, concierge, payment of participation, communication with organisers), production and installation of signage and advertising structures, and related services.',
              'If the Quote and this offer conflict, the Quote prevails.',
            ],
          },
          {
            h: '3. Price and payment',
            p: [
              'Prices are in UAE dirhams. VAT is added where the law requires it. Unless the Quote says otherwise: 50% upfront, 50% before dispatch or installation.',
              'Exhibition participation fees, venue services and other third-party payments made by the Contractor on the Client’s behalf are paid under a separate agency agreement or as a separate line in the Quote, with supporting documents provided.',
              'Government permits and approvals (including Dubai Municipality and DEWA) are not included unless the Quote states otherwise.',
            ],
          },
          {
            h: '4. Obligations of the Contractor',
            p: [
              'Provide the services in the scope and within the timeline set in the Quote; check the stand design against the venue rules known to the Contractor; keep the Client informed of progress; hand over the results and documents.',
            ],
          },
          {
            h: '5. Obligations of the Client',
            p: [
              'Provide accurate information, artwork, logos and approvals on time; pay on time; follow the rules of the exhibition and the venue. Delays in providing materials or payment shift the timeline accordingly.',
              'The Client confirms it holds the rights to the logos, images and texts it provides.',
            ],
          },
          {
            h: '6. Acceptance of services',
            p: ['Services are accepted under an acceptance certificate or in another way specified in the Quote. Comments on quality must be made in writing promptly — for exhibition services, before the stand opens.'],
          },
          {
            h: '7. Cancellation',
            p: [
              'The Client may cancel the order at any time by paying for work already performed and expenses the Contractor has already incurred (payments to contractors, organisers and venues) under the Quote. The rest of the prepayment is refunded.',
            ],
          },
          {
            h: '8. Liability',
            p: [
              'Each party is liable for failure to perform its obligations. The Contractor’s total liability is limited to the price of the relevant services under the Quote. The Contractor is not liable for decisions and actions of exhibition organisers, venues and government authorities, or for delays caused by the Client.',
            ],
          },
          {
            h: '9. Force majeure',
            p: ['The parties are released from liability for failure caused by circumstances beyond their control: natural disasters, epidemics, acts of authorities, cancellation or postponement of an exhibition by the organiser. In that case they agree on how to proceed and settle costs actually incurred.'],
          },
          {
            h: '10. Confidentiality and data',
            p: ['The parties keep each other’s commercial information confidential. Personal data is processed according to the privacy policy published on the Website.'],
          },
          {
            h: '11. Law and disputes',
            p: ['The agreement is governed by the laws of the Emirate of Dubai and the UAE. Disputes are resolved through negotiation, and failing that, by the courts of Dubai.'],
          },
          {
            h: '12. Term of the offer',
            p: ['The offer is valid from publication on the Website until withdrawn. Changes do not affect agreements already concluded. A separately signed contract takes precedence over this offer.'],
          },
          { h: '13. Contractor details', p: [`${who}. ${reach}.`] },
        ],
      },
    };

  return {
    privacy: {
      title: 'Политика конфиденциальности',
      description: `Как ${SITE_NAME} обращается с персональными данными с сайта ${SITE}: что получаем, зачем, сколько храним и как удалить.`,
      sections: [
        { p: [`Политика действует для сайта ${SITE} (далее — Сайт). Оператор персональных данных — ${who} (далее — мы). Связь: ${reach}.`] },
        {
          h: '1. Какие данные мы получаем',
          p: [
            'Только то, что вы сами указываете в форме заявки или в расчёте стоимости: имя, контакт для связи (телефон, WhatsApp, почта или ник в Telegram), описание задачи и параметры выбранной услуги (выставка, даты, площадь стенда, бюджет).',
            'На Сайте нет личных кабинетов, и мы не просим паспортные, платёжные и другие чувствительные данные. Пожалуйста, не указывайте их в заявке.',
          ],
        },
        {
          h: '2. Как заявка доходит до нас',
          p: [
            'Когда вы нажимаете кнопку отправки, Сайт открывает WhatsApp с уже заполненной заявкой. Сообщение уходит, только когда вы сами нажмёте «Отправить» в WhatsApp. Своей базы заявок у Сайта нет, и больше никуда он ваши данные не передаёт.',
            `Дальше переписка идёт в WhatsApp (WhatsApp LLC / Meta Platforms) — к сообщению применяется и его политика конфиденциальности. ${mail ? 'Написать нам можно и на почту или позвонить.' : `Можно и позвонить: ${CONTACTS.phone}.`}`,
          ],
        },
        {
          h: '3. Зачем',
          p: [
            'Чтобы ответить вам, уточнить задачу, подготовить расчёт или предложение, а если договоримся — оказать услугу и вести по ней документы.',
            'Для рассылок и рекламы данные не используем, не продаём и не передаём третьим лицам для их маркетинга.',
          ],
        },
        {
          h: '4. Основание',
          p: [
            'Ваше согласие, которое вы даёте при отправке заявки, и действия, нужные для подготовки и исполнения договора по вашей просьбе. Данные обрабатываем в соответствии с Федеральным декретом-законом ОАЭ № 45 от 2021 года о защите персональных данных.',
          ],
        },
        {
          h: '5. Кто ещё может видеть данные',
          p: [
            'Только те, кто помогает выполнить ваш заказ, и только в нужном объёме: организаторы выставок и площадки, подрядчики по производству и логистике, персонал стенда, партнёры консьерж-сервиса. А также государственные органы, если этого требует закон.',
            'Технические поставщики: Cloudflare (размещение и защита Сайта; в журналах сервера может сохраняться IP-адрес и тип браузера) и почтовый сервис, где работает наш ящик. Их серверы могут находиться за пределами ОАЭ.',
          ],
        },
        {
          h: '6. Cookies и аналитика',
          p: [
            'Сайт не использует рекламные и аналитические cookies и не отслеживает вас на других сайтах. Хостинг может ставить строго необходимые технические cookies для защиты Сайта от атак. Если подключим аналитику — сначала обновим эту политику.',
          ],
        },
        {
          h: '7. Сколько храним',
          p: ['Заявки, по которым не было заказа, — до 12 месяцев после последнего контакта. Данные по заказам — столько, сколько требует законодательство ОАЭ об учёте и налогах.'],
        },
        {
          h: '8. Ваши права',
          p: [
            `Вы можете узнать, какие данные о вас у нас есть, попросить исправить или удалить их, ограничить обработку или отозвать согласие. Напишите ${writeTo} — ответим в течение 30 дней. Вы также вправе обратиться с жалобой в UAE Data Office.`,
          ],
        },
        { h: '9. Дети', p: ['Сайт предназначен для компаний и не рассчитан на лиц младше 18 лет. Сознательно их данные мы не собираем.'] },
        { h: '10. Изменения', p: ['Мы можем обновлять политику. Действующая редакция всегда на этой странице, с датой последнего изменения.'] },
      ],
    },
    consent: {
      title: 'Согласие на обработку персональных данных',
      description: `Согласие, которое вы даёте ${SITE_NAME}, отправляя заявку на сайте ${SITE}.`,
      sections: [
        {
          p: [
            `Отправляя заявку на сайте ${SITE} (через форму, расчёт стоимости или кнопку WhatsApp), я свободно, своей волей и в своём интересе даю согласие ${who} (далее — Оператор) на обработку моих персональных данных на следующих условиях.`,
          ],
        },
        { h: '1. Данные', p: ['Имя; номер телефона, WhatsApp, адрес почты или ник в Telegram; описание задачи и выбранные параметры (услуга, выставка или объект, даты, площадь стенда, бюджет).'] },
        { h: '2. Цели', p: ['Ответ на заявку и её уточнение, подготовка расчёта или коммерческого предложения, заключение и исполнение договора, если он будет заключён.'] },
        {
          h: '3. Действия с данными',
          p: [
            'Сбор, запись, систематизация, хранение, уточнение, использование, передача (подрядчикам, без которых нельзя выполнить мой заказ, — организаторам выставок, производству, логистике, персоналу — и техническим поставщикам, указанным в политике конфиденциальности), блокирование, удаление и уничтожение — с использованием средств автоматизации и без них.',
          ],
        },
        {
          h: '4. Трансграничная передача',
          p: ['Я понимаю, что Оператор находится в Объединённых Арабских Эмиратах, мои данные будут обрабатываться там и могут передаваться поставщикам, чьи серверы находятся в других странах.'],
        },
        {
          h: '5. Срок и отзыв',
          p: [
            `Согласие действует до достижения целей обработки или 12 месяцев с последнего контакта с Оператором — что наступит раньше, если закон не требует хранить данные дольше. Я могу отозвать его в любой момент, написав ${writeTo}.`,
          ],
        },
        { h: '6. Политика конфиденциальности', p: ['С политикой конфиденциальности, опубликованной на Сайте, я ознакомлен.'] },
      ],
    },
    terms: {
      title: 'Пользовательское соглашение',
      description: `Правила пользования сайтом ${SITE_NAME}: цены, материалы, ссылки и ответственность.`,
      sections: [
        { p: [`Соглашение регулирует пользование сайтом ${SITE} (далее — Сайт), владелец — ${who} (далее — Владелец). Пользуясь Сайтом, вы принимаете эти условия.`] },
        {
          h: '1. Информация на Сайте',
          p: [
            'Сайт рассказывает о наших услугах. Цены — ориентировочные, в дирхамах ОАЭ, без VAT: точная стоимость зависит от размеров, материалов, площадки и сроков и фиксируется в расчёте или коммерческом предложении.',
            'Общие условия услуг изложены в публичной оферте. Конкретный объём, цена и сроки становятся обязательными после того, как вы подтвердите расчёт или оплатите счёт.',
            '3D-изображения стенда — визуализации, а не фото готовых проектов. Фото наших работ подписаны.',
          ],
        },
        {
          h: '2. Материалы',
          p: [
            'Тексты, дизайн, логотип, визуализации и фото на Сайте принадлежат Владельцу или используются с разрешения правообладателей. Цитировать их можно со ссылкой на Сайт; для другого использования нужно наше письменное согласие.',
          ],
        },
        { h: '3. Ссылки на другие сервисы', p: ['На Сайте есть ссылки на WhatsApp, Instagram и другие сторонние сервисы. Они работают по своим правилам, за их содержание и доступность мы не отвечаем.'] },
        {
          h: '4. Ответственность',
          p: [
            'Сайт предоставляется «как есть». Мы стараемся держать информацию точной, но не гарантируем её полноту и отсутствие ошибок и не отвечаем за решения, принятые только по Сайту, без расчёта. Даты выставок, правила площадок и сборы организаторов устанавливают организаторы, и они могут меняться.',
          ],
        },
        { h: '5. Персональные данные', p: ['Данные, которые вы нам отправляете, обрабатываются по политике конфиденциальности.'] },
        { h: '6. Право и споры', p: ['К соглашению применяется право эмирата Дубай и ОАЭ. Споры решаются переговорами, а если договориться не удалось — в судах Дубая.'] },
        { h: '7. Изменения', p: ['Мы можем менять соглашение; действующая редакция опубликована на этой странице.'] },
      ],
    },
    offer: {
      title: 'Публичная оферта',
      description: `Общие условия, на которых ${SITE_NAME} оказывает услуги по выставкам, производству рекламы и сопутствующие услуги.`,
      sections: [
        {
          p: [
            `Этот документ — предложение ${who} (далее — Исполнитель) заключить договор оказания услуг с компанией или индивидуальным предпринимателем (далее — Заказчик) на условиях ниже. Связь: ${reach}.`,
          ],
        },
        {
          h: '1. Термины',
          p: [
            'Расчёт — коммерческое предложение или счёт, который Исполнитель направляет Заказчику: состав услуг, объём, цена, сроки и порядок оплаты. Расчёт — неотъемлемая часть договора.',
            `Акцепт — письменное подтверждение Расчёта Заказчиком (в том числе ${mail ? 'по почте или в WhatsApp' : 'в WhatsApp'}) или оплата счёта полностью либо частично. С момента акцепта договор считается заключённым на условиях этой оферты и Расчёта.`,
          ],
        },
        {
          h: '2. Предмет',
          p: [
            'Исполнитель оказывает услуги, указанные в Расчёте: организация участия в выставках в ОАЭ (дизайн и застройка стенда, печать, персонал, питание, логистика, консьерж-сервис, оплата участия, переговоры с организаторами), изготовление и монтаж вывесок и рекламных конструкций, сопутствующие услуги.',
            'Если Расчёт и оферта расходятся, действует Расчёт.',
          ],
        },
        {
          h: '3. Цена и оплата',
          p: [
            'Цены — в дирхамах ОАЭ. VAT добавляется, если этого требует закон. Если в Расчёте не указано иное: 50% — предоплата, 50% — перед отгрузкой или монтажом.',
            'Сбор за участие в выставке, услуги площадки и другие платежи третьим лицам, которые Исполнитель вносит за Заказчика, оплачиваются по отдельному агентскому договору или отдельной строкой в Расчёте, с передачей закрывающих документов.',
            'Государственные разрешения и согласования (в том числе Dubai Municipality и DEWA) в стоимость не входят, если в Расчёте не указано иное.',
          ],
        },
        {
          h: '4. Обязанности Исполнителя',
          p: ['Оказать услуги в объёме и в сроки из Расчёта; проверить проект стенда на соответствие известным Исполнителю правилам площадки; сообщать Заказчику о ходе работ; передать результат и документы.'],
        },
        {
          h: '5. Обязанности Заказчика',
          p: [
            'Вовремя передавать достоверные сведения, макеты, логотипы и согласования; вовремя платить; соблюдать правила выставки и площадки. Задержка материалов или оплаты сдвигает сроки на то же время.',
            'Заказчик подтверждает, что у него есть права на переданные логотипы, изображения и тексты.',
          ],
        },
        {
          h: '6. Приёмка',
          p: ['Услуги принимаются по акту или иным способом, указанным в Расчёте. Замечания по качеству — письменно и сразу, а по выставочным услугам — до открытия стенда.'],
        },
        {
          h: '7. Отказ от заказа',
          p: [
            'Заказчик может отказаться от заказа в любой момент, оплатив уже выполненную работу и расходы, которые Исполнитель уже понёс по Расчёту (оплата подрядчикам, организаторам и площадкам). Остаток предоплаты возвращается.',
          ],
        },
        {
          h: '8. Ответственность',
          p: [
            'Стороны отвечают за неисполнение своих обязательств. Общая ответственность Исполнителя ограничена стоимостью соответствующих услуг по Расчёту. Исполнитель не отвечает за решения и действия организаторов выставок, площадок и государственных органов, а также за задержки по вине Заказчика.',
          ],
        },
        {
          h: '9. Обстоятельства непреодолимой силы',
          p: ['Стороны освобождаются от ответственности, если исполнению помешали обстоятельства вне их контроля: стихийные бедствия, эпидемии, решения властей, отмена или перенос выставки организатором. В этом случае стороны договариваются о дальнейших шагах и рассчитываются за фактически понесённые расходы.'],
        },
        { h: '10. Конфиденциальность и данные', p: ['Стороны не раскрывают коммерческую информацию друг друга. Персональные данные обрабатываются по политике конфиденциальности, опубликованной на Сайте.'] },
        { h: '11. Право и споры', p: ['К договору применяется право эмирата Дубай и ОАЭ. Споры решаются переговорами, а если договориться не удалось — в судах Дубая.'] },
        {
          h: '12. Срок действия оферты',
          p: ['Оферта действует с момента публикации на Сайте до её отзыва. Изменения не касаются уже заключённых договоров. Отдельно подписанный договор имеет приоритет над офертой.'],
        },
        { h: '13. Реквизиты Исполнителя', p: [`${who}. ${reach}.`] },
      ],
    },
  };
}

export const legalDoc = (lang: Lang, slug: LegalSlug): LegalDoc => docs(lang)[slug];
