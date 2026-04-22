import type { Metadata } from "next";
import { Barlow_Condensed, Inter_Tight, JetBrains_Mono } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pit Wall",
  description:
    "An F1 race strategy simulator grounded in real stint data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  return (
    <html lang="en" className="dark">
      <body
        className={`${barlowCondensed.variable} ${interTight.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] mix-blend-overlay">
          <svg className="h-full w-full">
            <filter id="pw-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#pw-noise)" />
          </svg>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
