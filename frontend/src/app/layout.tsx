import type { Metadata } from "next";
import { Manrope, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/* Dior-adjacent: high-contrast Didot display + refined modern sans */
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tolumak",
    template: "%s | Tolumak",
  },
  description:
    "Modern fashion house. Curated clothing, shoes, bags, and accessories.",
  keywords: ["fashion", "clothing", "Nigeria", "luxury", "online store"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
