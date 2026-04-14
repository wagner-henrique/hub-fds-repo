import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubfds.com";
const siteName = "HUB FDS";
const siteDescription =
  "HUB FDS em Arapiraca - AL: coworking, salas para reunião, auditório e estrutura para eventos, treinamentos e networking.";

const cspMetaContent = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "upgrade-insecure-requests",
].join("; ");

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    legalName: "HUB FDS - Fábrica de Sonhos",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: ["https://www.instagram.com/hubfds.br/"],
  },
  {
    "@context": "https://schema.org",
    "@type": "CoworkingSpace",
    name: "HUB FDS - Fábrica de Sonhos",
    url: siteUrl,
    image: `${siteUrl}/logo.png`,
    telephone: "+55 82 99999-9999",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Olavo Bilac, 210, Centro",
      addressLocality: "Arapiraca",
      addressRegion: "AL",
      postalCode: "57300-000",
      addressCountry: "BR",
    },
    openingHours: "Mo-Su 08:00-22:00",
    sameAs: ["https://www.instagram.com/hubfds.br/"],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "pt-BR",
  },
];

export const metadata: Metadata = {
  title: {
    default: "HUB FDS em Arapiraca | Coworking, Eventos e Reuniões",
    template: "%s | HUB FDS",
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  category: "business",
  authors: [{ name: "HUB FDS" }],
  creator: "HUB FDS",
  publisher: "HUB FDS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  keywords: [
    "hub fds arapiraca",
    "coworking em arapiraca",
    "espaço para eventos arapiraca",
    "sala de reunião arapiraca",
    "auditório arapiraca",
    "fábrica de sonhos arapiraca",
    "centro de inovação arapiraca",
    "coworking",
    "eventos",
    "reservas",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: "HUB FDS em Arapiraca | Coworking, Eventos e Reuniões",
    description: siteDescription,
    url: siteUrl,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Logo HUB FDS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HUB FDS em Arapiraca | Coworking, Eventos e Reuniões",
    description: siteDescription,
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={cspMetaContent} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {structuredData.map((schema, index) => (
          <script
            key={`ld-json-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={inter.className}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}