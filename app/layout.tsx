import type { Metadata, Viewport } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";

/*
 * Patyka Tarot — Root Layout
 *
 * Responsibilities:
 * - Load and configure Instrument Serif (headings) and DM Sans (body) via
 *   next/font/google. These are exposed as CSS variables (--font-heading,
 *   --font-body) that Tailwind v4 maps to font-heading and font-body utilities.
 * - Set Open Graph meta tags for social sharing (Facebook, Twitter, WhatsApp).
 * - Embed JSON-LD ProfessionalService schema for Google rich results.
 * - Set HTML lang="es" for Spanish content and accessibility.
 * - Apply dark theme via the body class (antialiased for font smoothing).
 *
 * No extra wrapper divs — the page component handles its own layout.
 */

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patyka Tarot | Lecturas, Brujitips y Sesiones",
  description:
    "Encuentra claridad y energía con Patyka Tarot. Descubre mis mejores Brujitips virales de TikTok y agenda tu sesión de lectura de cartas en línea fácilmente.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Agendar Sesión - Patyka Tarot",
    description:
      "Separa tu espacio para una lectura de cartas. Pagos automáticos y seguros. ¡Encuentra la claridad que buscas!",
    type: "website",
    images: [
      {
        url: "/poster/hero-poster.jpg",
        width: 1200,
        height: 630,
        alt: "Patyka Tarot — Lecturas y Brujitips",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * JSON-LD structured data for Google rich results.
 *
 * ProfessionalService schema tells Google this is a service business with
 * an offer catalog (tarot readings). The itemListElement array will be
 * populated dynamically when the services page is built (PR #5).
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Patyka Tarot",
  description: "Lectura de tarot online y consultoría espiritual",
  url: "https://patykatarot.com",
  telephone: "+573018339558",
  priceRange: "$$",
  areaServed: "CO",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Lecturas de Tarot",
    itemListElement: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} antialiased bg-bg-primary text-text-primary`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:liquid-glass focus:px-4 focus:py-2 focus:no-underline"
        >
          Saltar al contenido principal
        </a>
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
