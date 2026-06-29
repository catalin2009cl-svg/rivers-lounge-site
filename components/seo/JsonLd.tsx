export function RestaurantJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'FoodEstablishment'],
    name: "River's Lounge",
    alternateName: 'Rivers Lounge',
    description:
      'Restaurant premium, comenzi online, evenimente private și Cabana Rivers în Călărași. Experiență culinară de neuitat într-o atmosferă elegantă de lounge.',
    url: 'https://riverslounge.ro',
    telephone: '+40734642449',
    servesCuisine: ['Romanian', 'Mediterranean', 'International'],
    priceRange: '$$',
    currenciesAccepted: 'RON',
    paymentAccepted: 'Cash, Credit Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Str. Dobrogei nr. 1',
      addressLocality: 'Călărași',
      addressRegion: 'Călărași',
      addressCountry: 'RO',
    },
    hasMenu: 'https://riverslounge.ro/meniu',
    acceptsReservations: true,
    image: ['https://riverslounge.ro/og-image.jpg'],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '10:00',
        closes: '23:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Friday', 'Saturday'],
        opens: '10:00',
        closes: '01:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '11:00',
        closes: '23:00',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
