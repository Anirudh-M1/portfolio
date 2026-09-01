import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Weight lists are pruned to what's actually referenced across the new
// design's CSS (checked via grep) — no unused weights riding along.
// IBM Plex Mono 600 is new: docs-crt.css/after.css bold metric numbers,
// CRT links and .pts/.job body copy at that weight, all on the
// monospace body font, not Archivo — Archivo's own weights (used only
// for headings/wordmarks) are unchanged from the old design.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const TITLE = "Anirudh Moholkar: Software Engineer, Systems and Product";
const DESCRIPTION = "Anirudh Moholkar. Computer Engineering at UIUC. Software engineer, systems and product.";

export const viewport: Viewport = {
  // Matches the new design's --void background token (machine.css),
  // not the old carrier-board design's near-identical but distinct
  // #071512.
  themeColor: "#04110F",
};

// So the og:image/twitter:image meta tags resolve to the real deployed
// URL instead of Next's localhost:3000 fallback. Origin only, no
// /portfolio suffix: next.config.ts's basePath already prefixes the
// auto-detected opengraph-image/icon route URLs with /portfolio before
// Metadata resolves them against this base, so including it here too
// doubled the path (…/portfolio/portfolio/opengraph-image).
const SITE_URL = process.env.GITHUB_PAGES === "true" ? "https://anirudh-m1.github.io" : undefined;

export const metadata: Metadata = {
  ...(SITE_URL && { metadataBase: new URL(SITE_URL) }),
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
