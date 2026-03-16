import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: false,
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "Piqd — Validate Your Startup Idea Before You Build",
    template: "%s | Piqd",
  },
  description:
    "Post your startup idea. 10,000+ real people vote. Get a validation score, honest feedback, and a path to your first investor. India's startup validation platform.",
  keywords: [
    "startup validation",
    "idea validation",
    "startup ideas India",
    "validate startup idea",
    "product market fit",
    "startup feedback",
    "investor deal flow",
  ],
  authors: [{ name: "Piqd" }],
  creator: "Piqd",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "Piqd — Validate Your Startup Idea Before You Build",
    description:
      "Post your startup idea. Real people vote. Get a validation score and honest feedback.",
    siteName: "Piqd",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piqd — Validate Your Startup Idea",
    description:
      "Post your startup idea. Real individuals vote. Get a validation score and honest feedback.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F8F6F4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Instrument Serif — loaded via link for display font (not critical path) */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${dmMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
