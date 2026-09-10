import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ADORÉA — PMU · Makeup Pro · Nails · Djibouti',
  description: 'Studio beauté premium à Djibouti. Sourcils PMU, Candy Lips, Makeup Professionnel, Nails. Technique certifiée Belgique. Réservez en ligne.',
  keywords: [
    'PMU Djibouti', 'Sourcils PMU Djibouti', 'Candy Lips Djibouti',
    'Makeup Pro Djibouti', 'Nail Artist Djibouti', 'Beauty Studio Djibouti',
    'ADORÉA', 'maquillage permanent Djibouti'
  ],
  openGraph: {
    title: 'ADORÉA — PMU · Makeup Pro · Nails',
    description: 'Studio beauté premium à Djibouti. Technique certifiée Belgique.',
    url: 'https://adorea-dj.com',
    siteName: 'ADORÉA',
    locale: 'fr_DJ',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            "name": "ADORÉA",
            "description": "Studio beauté premium — PMU, Makeup Pro, Nails. Certifié Belgique.",
            "url": "https://adorea-dj.com",
            "telephone": "+25377596159",
            "email": "adlina@adorea-dj.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "PK13 – Bâtiment B1-2",
              "addressLocality": "Djibouti Ville",
              "addressCountry": "DJ"
            },
            "openingHours": "Mo-Sa 09:00-19:00",
            "priceRange": "4000–60000 FDJ"
          })}}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
