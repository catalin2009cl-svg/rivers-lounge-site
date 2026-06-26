// Mock data for Rivers Lounge website

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'drinks' | 'desserts';
  image: string;
  popular?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
  category: 'events' | 'daily-menu' | 'promotions';
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  date: string;
}

export interface Reservation {
  id: string;
  userId: string;
  location: 'restaurant' | 'cabin';
  date: string;
  guests: number;
  eventType: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
  depositPaid: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Ciorbă de burtă',
    description: 'Ciorbă tradițională românească, preparată după rețeta casei',
    price: 25,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '2',
    name: 'Mici cu muștar',
    description: '10 mici de vită și porc, serviți cu muștar și pâine proaspătă',
    price: 35,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '3',
    name: 'Paste Carbonara',
    description: 'Spaghetti cu sos cremos de ou, pecorino și guanciale',
    price: 38,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Burger Rivers',
    description: 'Burger premium cu carne de vită, brânză cheddar și sos special',
    price: 42,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '5',
    name: 'Pizza Margherita',
    description: 'Pizza clasică cu roșii San Marzano și mozzarella fior di latte',
    price: 32,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Cotlet de porc la grătar',
    description: 'Cotlet marinat servit cu legume la grătar și cartofi aurii',
    price: 48,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    name: 'Limonadă de casă',
    description: 'Limonadă proaspătă cu mentă și gheață',
    price: 15,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '8',
    name: 'Mojito',
    description: 'Cocktail clasic cu rom, lime, mentă și apă minerală',
    price: 28,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
  },
  {
    id: '9',
    name: 'Vin roșu - Fetească Neagră',
    description: 'Pahar de vin roșu românesc, 150ml',
    price: 22,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
  },
  {
    id: '10',
    name: 'Tiramisu',
    description: 'Desert italian clasic cu mascarpone și cafea',
    price: 28,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '11',
    name: 'Papanași',
    description: 'Papanași tradiționali cu smântână și dulceață de afine',
    price: 32,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  },
  {
    id: '12',
    name: 'Cheesecake New York',
    description: 'Cheesecake cremos cu bază de biscuiți și sos de fructe de pădure',
    price: 26,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop',
  },
];

export const events: Event[] = [
  {
    id: '1',
    title: 'Seară de Jazz Live',
    description: 'Bucurați-vă de muzică jazz live în fiecare vineri seara, începând cu ora 20:00.',
    date: '2024-02-15',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop',
    category: 'events',
  },
  {
    id: '2',
    title: 'Meniul Zilei - Specialități Românești',
    description: 'Astăzi vă propunem ciorbă de văcuță și sarmale în foi de viță, cu mămăliguță.',
    date: '2024-02-10',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    category: 'daily-menu',
  },
  {
    id: '3',
    title: '20% Reducere la Evenimente Private',
    description: 'Rezervă evenimentul tău înainte de 1 martie și beneficiezi de 20% reducere la meniu.',
    date: '2024-02-08',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop',
    category: 'promotions',
  },
  {
    id: '4',
    title: 'Deschidere Terasă de Vară',
    description: 'Vă așteptăm pe terasa noastră renovată, cu vedere la râu și ambient relaxant.',
    date: '2024-02-05',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    category: 'events',
  },
  {
    id: '5',
    title: 'Happy Hour - Cocktails',
    description: 'În fiecare joi, între 18:00-20:00, toate cocktailurile la jumătate de preț.',
    date: '2024-02-01',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop',
    category: 'promotions',
  },
  {
    id: '6',
    title: 'Curs de Gătit pentru Copii',
    description: 'Ateliere interactive pentru copii în fiecare sâmbătă dimineața.',
    date: '2024-01-28',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
    category: 'events',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Ionescu',
    text: 'Am sărbătorit aniversarea aici și totul a fost perfect! Mâncarea delicioasă, atmosfera romantică și personalul foarte atent.',
    rating: 5,
    date: '2024-01-15',
  },
  {
    id: '2',
    name: 'Alexandru Popescu',
    text: 'Cel mai bun restaurant din Călărași! Meniul este variat și prețurile sunt corecte pentru calitatea oferită.',
    rating: 5,
    date: '2024-01-10',
  },
  {
    id: '3',
    name: 'Elena Dumitrescu',
    text: 'Cabana Rivers este locul perfect pentru un weekend de relaxare. Peisajul este superb și facilitățile sunt excelente.',
    rating: 5,
    date: '2024-01-05',
  },
  {
    id: '4',
    name: 'Andrei Marinescu',
    text: 'Am comandat online pentru prima dată și am fost impresionat. Livrare rapidă și mâncarea a ajuns caldă.',
    rating: 4,
    date: '2023-12-28',
  },
];

export const menuCategories = [
  { id: 'appetizers', name: 'Aperitive', icon: '🥗' },
  { id: 'soups', name: 'Supe și Ciorbe', icon: '🍲' },
  { id: 'main', name: 'Feluri Principale', icon: '🍽️' },
  { id: 'grill', name: 'La Grătar', icon: '🥩' },
  { id: 'pasta', name: 'Paste', icon: '🍝' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'drinks', name: 'Băuturi', icon: '🍹' },
  { id: 'desserts', name: 'Deserturi', icon: '🍰' },
];

export const cabinFeatures = [
  { name: 'Capacitate', value: 'până la 12 persoane' },
  { name: 'Dormitoare', value: '3 dormitoare' },
  { name: 'Băi', value: '2 băi complet utilate' },
  { name: 'Bucătărie', value: 'complet echipată' },
  { name: 'Grătar', value: 'zonă de grătar exterior' },
  { name: 'Parcare', value: 'parcare privată' },
  { name: 'WiFi', value: 'internet de mare viteză' },
  { name: 'Climatizare', value: 'aer condiționat' },
];

export const deliveryZones = [
  { name: 'Călărași', minOrder: 50, deliveryFee: 0 },
  { name: 'Tonea', minOrder: 150, deliveryFee: 15 },
  { name: 'Modelu', minOrder: 200, deliveryFee: 20 },
];

export const restaurantInfo = {
  name: "River's Lounge",
  address: 'Str. Dobrogei nr. 1, Călărași, România',
  phone: '0734 642 449',
  email: 'contact@riverslounge.ro',
  schedule: {
    weekdays: '07:30 – 00:00',
    weekend: '07:30 – 00:00',
  },
  social: {
    facebook: 'https://facebook.com/riverslounge',
    instagram: 'https://instagram.com/riverslounge',
    tripadvisor: 'https://tripadvisor.com/riverslounge',
  },
};

export interface Facility {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  href: string;
  capacity?: string;
  highlights: string[];
}

export interface CabinPackage {
  id: string;
  name: string;
  description: string;
  priceFrom: number;
  duration: string;
  includes: string[];
  idealFor: string[];
}

export const facilities: Facility[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    slug: 'restaurant',
    description:
      'Restaurant premium cu bucătărie tradițională românească și preparate internaționale, într-un ambient elegant de lounge.',
    shortDescription: 'Bucătărie rafinată și atmosferă caldă',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    href: '/restaurant',
    capacity: '120 locuri',
    highlights: ['Terasă cu vedere la râu', 'Bar premium', 'Meniul zilei', 'Rezervări online'],
  },
  {
    id: 'online-shop',
    name: 'Comandă Acum',
    slug: 'meniu',
    description:
      'Comandă mâncare delicioasă online și primește livrare rapidă în Călărași și zonele limitrofe.',
    shortDescription: 'Comandă mâncare delicioasă direct la ușa ta',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
    href: '/meniu',
    highlights: ['Livrare în aceeași zi', 'Plată la livrare', 'Comenzi recurente', 'Zone multiple'],
  },
  {
    id: 'events',
    name: 'Evenimente Private',
    slug: 'rezervari',
    description:
      'Organizăm nunți, botezuri, petreceri corporate, aniversări și evenimente speciale — totul de la A la Z.',
    shortDescription: 'Nunți, botezuri, corporate și petreceri',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
    href: '/rezervari',
    capacity: 'până la 150 persoane',
    highlights: ['Meniu personalizat', 'Decor tematic', 'DJ & sonorizare', 'Catering inclus'],
  },
  {
    id: 'cabin',
    name: 'Cabana Rivers',
    slug: 'cabana',
    description:
      'Cabana destinată evenimentelor speciale și petrecerilor private — weekend-uri, team building, petreceri tematice și sărbători în natură.',
    shortDescription: 'Evenimente și petreceri speciale în natură',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
    href: '/cabana',
    capacity: 'până la 12 persoane cazare / 30 eveniment',
    highlights: ['Grătar exterior', 'Zonă petreceri', 'Cazare inclusă', 'Peisaj natural'],
  },
  {
    id: 'rivers-land',
    name: "River's Land",
    slug: 'rivers-land',
    description:
      "Loc de joacă și distracție special amenajat pentru cei mici — activități, jocuri și aventură în siguranță.",
    shortDescription: 'Loc de joacă și distracție pentru cei mici',
    image: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=800&h=600&fit=crop',
    href: '/rivers-land',
    highlights: ['Joacă în siguranță', 'Activități pentru copii', 'Supraveghere', 'Program zilnic'],
  },
  {
    id: 'rivers-marina',
    name: "River's Marina",
    slug: 'rivers-marina',
    description:
      'Club exclusivist, evenimente live și vibrații de lounge la malul apei — o experiență unică în Călărași.',
    shortDescription: 'Club, evenimente și vibrații la malul apei',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    href: '/rivers-marina',
    highlights: ['Evenimente Live', 'Club & Lounge', 'Evenimente Private', 'Vedere la apă'],
  },
];

export const eventTypes = [
  { id: 'wedding', name: 'Nuntă', icon: '💒' },
  { id: 'baptism', name: 'Botez', icon: '👶' },
  { id: 'birthday', name: 'Aniversare', icon: '🎂' },
  { id: 'corporate', name: 'Corporate / Team Building', icon: '🏢' },
  { id: 'party', name: 'Petrecere Privată', icon: '🎉' },
  { id: 'other', name: 'Alt eveniment', icon: '✨' },
];

export const cabinPackages: CabinPackage[] = [
  {
    id: 'weekend-relax',
    name: 'Weekend Relaxare',
    description: 'Evadare de 2 nopți în natură, ideală pentru familii sau grupuri mici.',
    priceFrom: 800,
    duration: '2 nopți',
    includes: ['Cazare 12 persoane', 'Grătar inclus', 'Lemne de foc', 'WiFi & parcare'],
    idealFor: ['Familii', 'Grupuri de prieteni', 'Escapade romantice'],
  },
  {
    id: 'private-party',
    name: 'Petrecere Privată',
    description: 'Pachet complet pentru petreceri tematice, aniversări sau seri speciale la cabană.',
    priceFrom: 1500,
    duration: '1 zi / noapte',
    includes: ['Decor tematic', 'Meniu catering', 'Sonorizare', 'Organizator dedicat'],
    idealFor: ['Aniversări', 'Petreceri tematice', 'Seri între prieteni'],
  },
  {
    id: 'corporate-retreat',
    name: 'Team Building Corporate',
    description: 'Program complet pentru echipe — activități outdoor, masă și cazare.',
    priceFrom: 2000,
    duration: '1-2 zile',
    includes: ['Activități outdoor', 'Mese complete', 'Sala de conferințe', 'Facilitator'],
    idealFor: ['Echipe corporate', 'Workshop-uri', 'Retreat-uri'],
  },
  {
    id: 'special-event',
    name: 'Eveniment Special',
    description: 'Pachet personalizat pentru evenimente unice — botezuri, logodne, reuniuni de familie.',
    priceFrom: 1200,
    duration: 'Personalizat',
    includes: ['Planificare dedicată', 'Meniu la alegere', 'Decor personalizat', 'Fotograf recomandat'],
    idealFor: ['Botezuri', 'Logodne', 'Reuniuni de familie'],
  },
];

export const reservationLocations = [
  {
    id: 'restaurant' as const,
    name: 'Restaurant',
    description: 'Rezervă o masă în restaurantul nostru',
  },
  {
    id: 'cabin' as const,
    name: 'Cabana Rivers',
    description: 'Rezervă cabana pentru evenimente sau cazare',
  },
  {
    id: 'event' as const,
    name: 'Eveniment Privat',
    description: 'Organizează un eveniment special la River\'s Lounge',
  },
];
