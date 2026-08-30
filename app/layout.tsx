import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Weight lists are pruned to what's actually referenced in carrier.css /
// carrier-mobile.css (checked via grep) — no unused weights riding along.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const TITLE = "Anirudh Moholkar — Distributed Systems & Backend Infrastructure";
const DESCRIPTION =
  "Portfolio of Anirudh Moholkar — distributed systems, agent infrastructure, and the projects behind them.";

export const viewport: Viewport = {
  themeColor: "#071512",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${ibmPlexMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
