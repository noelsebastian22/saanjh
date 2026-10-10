/**
 * Every string and image on the page. Change this file first when re-skinning.
 * Photos are Unsplash slugs; astro:assets optimises them at build.
 */
const u = (slug: string) => `https://images.unsplash.com/photo-${slug}`;

export interface Dish { name: string; note: string; img: string; origin?: string; }
export interface Region { name: string; blurb: string; img: string; }
export interface Review { quote: string; author: string; source: string; }
export interface Stat { value: number; dec: number; suffix: string; label: string; }
/** Days use JS numbering: 0 Sunday ... 6 Saturday. Sittings are 24h "HH:MM" ranges, last start time inclusive. */
export interface Booking { days: number[]; sittings: [string, string][]; step: number; }
export interface Venue { id: string; city: string; address: string; hours: string; phone: string; img: string; booking: Booking; }

export const site = {
  brand: 'Saanjh',
  tagline: 'The hour the fires are lit',
  description:
    'A modern Indian kitchen built on slow cooking, live fire and the stories that travel with a recipe.',

  nav: [
    { label: 'The Story', href: '#story' },
    { label: 'Menu', href: '#menu' },
    { label: 'The Room', href: '#room' },
    { label: 'Visit', href: '#visit' },
  ],

  hero: {
    eyebrow: 'Modern Indian Kitchen',
    title: 'Saanjh',
    lede: 'Every plate carries a story. Ours begins with fire, patience and a spice box handed down three generations.',
    img: u('1663530761401-15eefb544889'),
    alt: 'A chef finishing a plated dish with sauce',
    primary: { label: 'Reserve a table', href: '#reserve' },
    secondary: { label: 'See the menu', href: '#menu' },
  },

  intro: {
    eyebrow: 'The Word',
    title: 'Saanjh is the hour between day and night.',
    body: [
      'Across the north it is when the clay ovens are fired, the dal goes on for tomorrow, and somebody starts a story the whole table has heard before.',
      'We cook the recipes those evenings carried, from Kashmir down the coast to Kerala. Nothing is fusion for the sake of it. Every dish on this menu can name the place it came from.',
    ],
  },

  masterpieces: {
    eyebrow: 'Signatures',
    title: 'Crafted icons and signature plates.',
    lede: 'Ten plates that never leave the menu, each from the place that taught it to us.',
    items: <Dish[]>[
      { name: 'Old Delhi Butter Chicken', note: 'Tandoor first, then the makhani', origin: 'Delhi', img: u('1542367592-8849eb950fd8') },
      { name: 'Kashmiri Rogan Josh', note: 'Six hours, bone in', origin: 'Kashmir', img: u('1559203244-78de52adba0e') },
      { name: 'Dum Biryani', note: 'Sealed, never stirred', origin: 'Hyderabad', img: u('1589302168068-964664d93dc0') },
      { name: 'Saanjh Dal', note: 'Twenty four hours on the coals', origin: 'Punjab', img: u('1690915475414-9aaecfd3ba74') },
      { name: 'Amritsari Kulcha', note: 'Clay oven, morning dough', origin: 'Amritsar', img: u('1640625314547-aee9a7696589') },
      { name: 'Thalassery Biryani', note: 'Short grain rice, fried shallot', origin: 'Malabar coast', img: u('1631515243349-e0cb75fb8d3a') },
      { name: 'Chettinad Duck', note: 'Black pepper, star anise', origin: 'Tamil Nadu', img: u('1676471926534-d5c9771909fa') },
      { name: 'The Royal Thali', note: 'A whole feast on one plate', origin: 'Rajasthan', img: u('1589778655375-3e622a9fc91c') },
      { name: 'Tangra Chilli Noodles', note: 'Wok fired, Kolkata Chinatown', origin: 'Kolkata', img: u('1517244683847-7456b63c5969') },
      { name: 'Goan Xacuti', note: 'Roasted coconut masala', origin: 'Goa', img: u('1567337710282-00832b415979') },
    ],
  },

  /* Decorative marquee divider. Eight words, rendered three times. */
  band: ['Slow Cooked', 'Live Fire', 'Hand Ground', 'Clay Oven', 'Coastal', 'Northern', 'Seasonal', 'No Shortcuts'],

  menu: {
    eyebrow: 'The Menu',
    title: 'Explore the menu, course by course.',
    lede: 'Six sections, changed with the season. The kitchen sends them in the order it thinks they read best.',
    regions: <Region[]>[
      { name: 'Small Plates', blurb: 'Sharp, fast, meant for the first ten minutes.', img: u('1553267574-277716d448fb') },
      { name: 'From the Clay Oven', blurb: 'Everything that touches the tandoor before it touches a plate.', img: u('1640625314547-aee9a7696589') },
      { name: 'Slow Cooked', blurb: 'Nothing here took less than four hours.', img: u('1542367592-8849eb950fd8') },
      { name: 'Rice and Grains', blurb: 'Sealed pots, opened at the table.', img: u('1697155406055-2db32d47ca07') },
      { name: 'Sweet Endings', blurb: 'Cardamom, saffron, and one thing with chocolate.', img: u('1635952346904-95f2ccfcd029') },
      { name: 'The Bar', blurb: 'Spice-led cocktails and a short, opinionated wine list.', img: u('1683744129482-2cdd6645ed29') },
    ],
  },

  fullbleed: {
    title: 'A feast worth gathering for.',
    body: 'Tables of eight or more eat the way we actually eat at home. One menu, everything in the middle, no one deciding alone.',
    cta: { label: 'Enquire about group dining', href: '#reserve' },
    img: u('1547573854-74d2a71d0826'),
    alt: 'An overhead table set with many shared dishes',
  },

  dishes: {
    eyebrow: 'From the Pass',
    title: 'Dishes with a story to tell.',
    items: <Dish[]>[
      { name: 'The Dal', note: 'Started at four in the afternoon for service the next night. It has been on the menu since the first week and it will not be coming off.', img: u('1690915475414-9aaecfd3ba74') },
      { name: 'The Biryani', note: 'Sealed with dough, opened in front of you. If the steam escapes early, the dish is wrong and we start again.', img: u('1589302168068-964664d93dc0') },
      { name: 'The Kulcha', note: 'Dough proved at six in the morning, slapped onto the wall of the tandoor to order. Nothing about it can be prepared ahead.', img: u('1574448857443-dc1d7e9c4dad') },
    ],
  },

  stats: {
    eyebrow: 'By the Numbers',
    title: 'A story worth telling.',
    items: <Stat[]>[
      { value: 24, dec: 0, suffix: 'h', label: 'Longest cook on the menu' },
      { value: 38, dec: 0, suffix: '', label: 'Spices ground in house' },
      { value: 4.9, dec: 1, suffix: '', label: 'Average guest rating' },
      { value: 12, dec: 0, suffix: '', label: 'Regions on one menu' },
    ],
  },

  room: {
    eyebrow: 'The Room',
    title: 'Beneath the blossoms.',
    body: [
      'Forty covers, low light, and a ceiling of paper blossom that takes two people a full day to hang each spring.',
      'The kitchen is open. If you sit at the counter you will watch your food being finished, which is the whole point of sitting at the counter.',
    ],
    img: u('1709548145082-04d0cde481d4'),
    alt: 'The dining room at night, lit by low brass pendants over the bar',
    cta: { label: 'Book a table in the room', href: '#reserve' },
  },

  reviews: {
    eyebrow: 'Guests',
    items: <Review[]>[
      { quote: 'The dal alone is worth the trip. I have thought about it every week since.', author: 'Priya R.', source: 'Google' },
      { quote: 'Sat at the counter and barely spoke for an hour. Watching that kitchen work is the show.', author: 'Tom H.', source: 'Google' },
      { quote: 'Every dish arrived with a sentence about where it came from. None of it felt rehearsed.', author: 'Anita S.', source: 'OpenTable' },
      { quote: 'Booked for four, stayed for three hours. The staff never once made us feel rushed.', author: 'Michael D.', source: 'Google' },
      { quote: 'Finally somewhere that treats Indian food as a kitchen, not a category.', author: 'Ravi M.', source: 'Tripadvisor' },
      { quote: 'The biryani gets opened at the table. Small piece of theatre, enormous payoff.', author: 'Clare W.', source: 'OpenTable' },
      { quote: 'Room is beautiful without being precious. You can actually hear the person opposite you.', author: 'Ben A.', source: 'Google' },
      { quote: 'Took my parents. My mother asked for the recipe, which has never happened anywhere.', author: 'Nisha K.', source: 'Google' },
      { quote: 'The wine list is short and every single thing on it makes sense with the food.', author: 'Daniel P.', source: 'Tripadvisor' },
      { quote: 'Went in expecting a nice dinner. Left having learned something.', author: 'Sarah J.', source: 'OpenTable' },
    ],
  },

  reserve: {
    eyebrow: 'Reservations',
    title: 'Let the story begin, together.',
    body: 'Tables open sixty days ahead. A few counter seats at each venue are always kept back for walk-ins.',
    windowDays: 60,
    maxGuests: 8,
    groups: {
      text: 'Nine or more? We set one menu for the whole table.',
      label: 'Enquire about group dining',
      href: 'mailto:groups@saanjh.example?subject=Group%20dining%20enquiry',
    },
    privateHire: { label: 'Private hire', href: 'mailto:events@saanjh.example?subject=Private%20hire' },
    occasions: ['Birthday', 'Anniversary', 'Date night', 'Business', 'Celebration'],
  },

  locations: {
    eyebrow: 'Visit',
    title: 'Two ways to taste the tale.',
    venues: <Venue[]>[
      {
        id: 'kingsway',
        city: 'The Restaurant',
        address: '48 Kingsway, London WC2B 6EY',
        hours: 'Tue to Sat, 5.30pm till late',
        phone: '020 7946 0112',
        img: u('1650490632010-e18cbb694dd1'),
        booking: { days: [2, 3, 4, 5, 6], sittings: [['17:30', '21:45']], step: 15 },
      },
      {
        id: 'bermondsey',
        city: 'The Counter',
        address: '11 Bermondsey Street, London SE1 3XF',
        hours: 'Wed to Sun, 12pm till 10pm',
        phone: '020 7946 0188',
        img: u('1583354608715-177553a4035e'),
        booking: { days: [0, 3, 4, 5, 6], sittings: [['12:00', '14:30'], ['17:30', '21:00']], step: 15 },
      },
    ],
  },

  footer: {
    note: 'Saanjh is an independent kitchen. Menus change with the season and without warning.',
    links: [
      { label: 'Instagram', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Private hire', href: 'mailto:events@saanjh.example?subject=Private%20hire' },
      { label: 'Allergens', href: '#' },
    ],
  },
};

export type Site = typeof site;
