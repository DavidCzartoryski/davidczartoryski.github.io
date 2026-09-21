import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL, profile } from "@/data/site";
import { AudioProvider } from "@/components/AudioProvider";
import { IntroProvider } from "@/components/IntroContext";
import IntroGate from "@/components/IntroGate";
import Nav from "@/components/Nav";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const DESCRIPTION =
  "David Czartoryski: software engineer and founder at Northeastern University, Massachusetts state wrestling champion, 23 countries stamped. Pawtograder, Summit Partners, Mosaiq, and Hercules Holdings.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${profile.name} · Passport`,
  description: DESCRIPTION,
  keywords: [
    "David Czartoryski",
    "software engineer",
    "Northeastern University",
    "founder",
    "Hercules Holdings",
    "EternalTap",
    "CrediMax",
    "wrestling",
    "travel",
  ],
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: profile.name,
    title: `${profile.name} · Software engineer, founder, 23 countries`,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} · Software engineer, founder, 23 countries`,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${instrument.variable} ${plexMono.variable} h-full`}
    >
      <body className="grain min-h-full">
        <AudioProvider>
          <IntroProvider>
            <IntroGate />
            <Nav />
            {children}
          </IntroProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
