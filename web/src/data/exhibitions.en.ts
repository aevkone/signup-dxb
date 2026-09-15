import type { Block } from './exhibitions';

/** Английская версия. Порядок и слаги совпадают с русской. */
export const BLOCKS_EN: Block[] = [
  {
    slug: 'stand-design',
    title: 'Stand design & concept',
    short: 'From a simple corner booth to a complex exhibit',
    icon: 'stand',
    lead: 'We don’t start with a picture — we start with your product: what you’re showing, to whom, and how a visitor should move through the stand. Then comes the concept, the working design and the build.',
    includes: [
      {
        title: 'Product study',
        text: 'We look at what you’re bringing, the size and weight of the exhibits, and what should be front and centre versus in the background.',
      },
      {
        title: 'Concept development',
        text: 'Zoning, visitor flow, placement of the meeting room, storage and photo area. You see a visualisation before anything goes into production.',
      },
      {
        title: 'Engineering',
        text: 'Working drawings and layouts that follow venue rules: build height, rigging, loads and fire safety requirements.',
      },
      {
        title: 'Build',
        text: 'We produce the structures and graphics, deliver them to the venue, install them and dismantle after the show.',
      },
    ],
    points: [
      'Modular system or custom build — we’ll compare the costs',
      'Inline, corner, peninsula, island or double-deck',
      'The design is checked against organiser rules before production',
      'We’ll shape the scope around your budget',
    ],
  },
  {
    slug: 'print',
    title: 'Print & branded merchandise',
    short: 'Banners, roll-ups, catalogues, brand book',
    icon: 'print',
    lead: 'Everything that hangs on your stand or goes into visitors’ hands is made in our own production — no middlemen and no slipping deadlines.',
    includes: [
      {
        title: 'Large format',
        text: 'Banners, stand signage, roll-ups, press walls and backlit panels.',
      },
      {
        title: 'Printed materials',
        text: 'Flyers, brochures, catalogues, business cards and staff badges.',
      },
      {
        title: 'Merchandise',
        text: 'Branded gifts for visitors and partners: drinkware, stationery and team apparel.',
      },
      {
        title: 'Graphic design',
        text: 'No artwork yet? We’ll create it. Have it already? We’ll adapt it to the structure sizes. Need a brand book? We’ll put one together.',
      },
    ],
    points: [
      'In-house production — we control timing and quality',
      'Ready artwork adapted to the print areas',
      'Matte, gloss or satin finish to suit lighting and filming',
    ],
  },
  {
    slug: 'staff',
    title: 'Stand staff',
    short: 'Hostesses, photographer, videographer, show programme',
    icon: 'staff',
    lead: 'A stand is only as good as the people on it. We build the team around your goal and the language your visitors speak.',
    includes: [
      {
        title: 'Hostesses & promoters',
        text: 'English and Arabic speakers who greet visitors, handle typical questions and collect contacts.',
      },
      {
        title: 'Photographer',
        text: 'Coverage of the stand, meetings and guests — useful both for your report and for social media.',
      },
      {
        title: 'Videographer',
        text: 'A film about your participation, from a short recap to a full video for your website.',
      },
      {
        title: 'Show programme',
        text: 'Performers, a host and interactive elements when you need to draw a crowd to the stand.',
      },
    ],
    points: [
      'Languages matched to the show’s audience',
      'Branded apparel for the team',
      'Staff briefed on your product before opening',
    ],
  },
  {
    slug: 'catering',
    title: 'Catering',
    short: 'Hospitality for guests and meals for your team',
    icon: 'catering',
    lead: 'Two different jobs that often get mixed up: hospitality for stand visitors, and proper meals for your team working ten-hour days.',
    includes: [
      {
        title: 'Stand hospitality',
        text: 'Coffee, water and light snacks for guests. A buffet reception on the stand can be arranged separately.',
      },
      {
        title: 'Team meals',
        text: 'Meals for your staff on every day of the show, including build-up and breakdown.',
      },
      {
        title: 'Kitchen equipment',
        text: 'Coffee machine, fridge, water cooler and tableware — rented for the duration of the show.',
      },
    ],
    points: ['Halal and vegetarian options included', 'Meals during build-up and breakdown, not just show days'],
  },
  {
    slug: 'logistics',
    title: 'Logistics',
    short: 'Delivery of materials and equipment',
    icon: 'logistics',
    lead: 'We deliver structures, graphics, exhibits and equipment to the venue on the schedule set by the build-up rules — not by our convenience.',
    includes: [
      {
        title: 'Delivery to the venue',
        text: 'Pick-up from production or your warehouse, delivered to the build-up gate within the assigned slot.',
      },
      {
        title: 'Passes & accreditation',
        text: 'Access for installers and vehicles to the exhibition centre.',
      },
      {
        title: 'Removal after the show',
        text: 'Breakdown, loading and removal. If you buy the structures, we deliver them to your warehouse.',
      },
      {
        title: 'Storage between shows',
        text: 'Cases, covers and warehouse space if you plan to reuse the stand.',
      },
    ],
    points: ['Dubai, Abu Dhabi, Sharjah and Ajman', 'We plan backwards from the venue’s build-up schedule'],
  },
  {
    slug: 'concierge',
    title: 'Concierge service',
    short: 'Arrival, accommodation, transport, leisure',
    icon: 'concierge',
    lead: 'A separate service for teams flying in for a show. The goal is simple: you focus on meetings, not on logistics in an unfamiliar city.',
    includes: [
      {
        title: 'Airport pick-up & transfers',
        text: 'We meet you at the airport, take you to the hotel, then to the venue and back on every show day.',
      },
      {
        title: 'Accommodation',
        text: 'Hotels chosen to fit your budget and the travel time to the exhibition centre.',
      },
      {
        title: 'Connectivity & money',
        text: 'Local SIM cards on arrival day and help with currency exchange.',
      },
      {
        title: 'Leisure',
        text: 'Restaurants, tours and a programme for the partners you bring along.',
      },
    ],
    points: ['Also available for business trips without an exhibition', 'One point of contact for the whole trip'],
  },
  {
    slug: 'payment',
    title: 'Participation payment support',
    short: 'Agency agreement to pay for the exhibition',
    icon: 'payment',
    lead: 'Paying for participation from abroad is where many foreign companies get stuck. We handle this payment for you under an agency agreement.',
    includes: [
      {
        title: 'Agency agreement',
        text: 'We sign an agreement under which we pay the exhibition organiser for your participation.',
      },
      {
        title: 'Supporting documents',
        text: 'You receive the full set of documents for the payment.',
      },
    ],
    points: ['Solves the cross-border payment issue', 'Available on its own, without other blocks'],
    note: {
      title: 'What to check in advance',
      text: 'The documents and terms depend on the organiser of the specific show and on your jurisdiction. Get in touch — we’ll review your case before anything is signed.',
    },
  },
  {
    slug: 'negotiations',
    title: 'Negotiations with organisers',
    short: 'Venue search and direct contact with halls',
    icon: 'talks',
    lead: 'We have direct contacts at Dubai’s exhibition venues. What this gives you is time — the weeks that are always in short supply before a show.',
    includes: [
      {
        title: 'Choosing the show & space',
        text: 'We check which exhibition truly matches your audience and which spaces are still available.',
      },
      {
        title: 'Direct line to the hall',
        text: 'We handle emails and calls with the organiser on your behalf: space booking, rules and deadlines.',
      },
      {
        title: 'Build-up rules',
        text: 'We request the venue rules and check that your stand design complies with them.',
      },
    ],
    points: [
      'Direct contacts instead of the organiser’s general inbox',
      'Venue restrictions checked before you approve the design',
    ],
    note: {
      title: 'A real case',
      text: 'Clients had spent weeks unable to reach the exhibition organisers. The issue was resolved quickly — with a direct phone call and a WhatsApp message.',
    },
  },
];
