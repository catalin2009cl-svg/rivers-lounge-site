import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { ConditionalAnalytics } from '@/components/analytics-provider'
import { ThemeProvider } from 'next-themes'
import { CartProvider } from '@/contexts/cart-context'
import { Toaster } from '@/components/ui/sonner'
import { CookieBanner } from '@/components/cookies/cookie-banner'
import { getSettings } from '@/lib/server-data'
import './globals.css'

export const dynamic = 'force-dynamic'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const b = settings.branding;
  const ogImage = b?.ogImage ?? '/og-image.jpg';

  return {
    metadataBase: new URL('https://riverslounge.ro'),
    title: {
      default: "River's Lounge | Restaurant, Evenimente & Cabană în Călărași",
      template: "%s | River's Lounge",
    },
    description: 'Restaurant premium, comenzi online, evenimente private și Cabana Rivers în Călărași. Experiență culinară de neuitat într-o atmosferă elegantă de lounge.',
    keywords: [
      'restaurant Călărași', 'comandă mâncare Călărași', 'rezervări evenimente Călărași',
      'Cabana Rivers', "River's Lounge", 'catering Călărași', "River's Land",
      "River's Marina", 'lounge Călărași', 'livrare mâncare Călărași',
    ],
    authors: [{ name: "River's Lounge", url: 'https://riverslounge.ro' }],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      title: "River's Lounge | Restaurant, Evenimente & Cabană în Călărași",
      description: 'Restaurant premium, comenzi online și evenimente private în Călărași.',
      type: 'website',
      locale: 'ro_RO',
      siteName: "River's Lounge",
      url: 'https://riverslounge.ro',
      images: [{ url: ogImage, width: 1200, height: 630, alt: "River's Lounge — Restaurant & Evenimente în Călărași" }],
    },
    twitter: {
      card: 'summary_large_image',
      title: "River's Lounge | Restaurant, Evenimente & Cabană în Călărași",
      description: 'Restaurant premium, comenzi online și evenimente private în Călărași.',
      images: [ogImage],
    },
    alternates: {
      canonical: 'https://riverslounge.ro',
    },
    icons: {
      icon: b?.favicon && b.favicon !== '/favicon.ico'
        ? b.favicon
        : [
            { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
            { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
            { url: '/icon.svg', type: 'image/svg+xml' },
          ],
      apple: '/apple-icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#1a2744',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className={`${playfair.variable} ${inter.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="rl-theme">
          <CartProvider>
            {children}
            <Toaster richColors position="top-right" />
            <CookieBanner />
          </CartProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <ConditionalAnalytics />}
      </body>
    </html>
  )
}
