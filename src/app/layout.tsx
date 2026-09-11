import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ADORÉA — PMU · Makeup Pro · Nails · Djibouti',
  description: 'Studio beauté premium à Djibouti. Sourcils PMU, Candy Lips, Makeup Professionnel, Nails. Technique certifiée Belgique.',
  keywords: ['PMU Djibouti','Sourcils PMU Djibouti','Candy Lips Djibouti','Makeup Pro Djibouti','ADORÉA'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ADORÉA — PMU · Makeup Pro · Nails',
    description: 'Studio beauté premium à Djibouti. Technique certifiée Belgique.',
    url: 'https://adorea-dj.com',
    siteName: 'ADORÉA',
    locale: 'fr_DJ',
    type: 'website',
    images: [{ url: '/images/hero-main.png', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          name: 'ADORÉA',
          description: 'Studio beauté premium — PMU, Makeup Pro, Nails. Certifié Belgique.',
          url: 'https://adorea-dj.com',
          telephone: '+25377596159',
          email: 'adlina@adorea-dj.com',
          address: { '@type': 'PostalAddress', streetAddress: 'PK13 – Bâtiment B1-2', addressLocality: 'Djibouti Ville', addressCountry: 'DJ' },
          geo: { '@type': 'GeoCoordinates', latitude: 11.570805180053526, longitude: 43.076942066923 },
          openingHours: 'Mo-Sa 09:00-19:00',
          sameAs: [
            'https://www.instagram.com/adorea.dj',
            'https://www.facebook.com/share/1FeC3VJB82/',
            'https://www.tiktok.com/@adorea.dj',
            'https://www.snapchat.com/add/adorea.dj',
          ],
        })}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
