import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Space_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

// Display — characterful, food-editorial. Used with restraint on headings.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Body — clean workhorse, deliberately not Inter.
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Mono — the "kitchen ticket / label" texture: timings, quantities, tags.
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chef-AI — Your Personal AI Chef",
  description: "Snap a photo of your fridge, get a recipe.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChefAI",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
