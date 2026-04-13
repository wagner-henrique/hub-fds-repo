import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubfds.com";

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

export const metadata: Metadata = {
  title: "HUB FDS - Fábrica de Sonhos",
  description: "Centro de Inovação em Arapiraca - AL",
  metadataBase: new URL(siteUrl),
  applicationName: "HUB FDS",
  keywords: [
    "hub fds",
    "fabrica de sonhos",
    "centro de inovacao",
    "arapiraca",
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
    siteName: "HUB FDS",
    title: "HUB FDS - Fábrica de Sonhos",
    description: "Centro de Inovação em Arapiraca - AL",
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
    title: "HUB FDS - Fábrica de Sonhos",
    description: "Centro de Inovação em Arapiraca - AL",
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