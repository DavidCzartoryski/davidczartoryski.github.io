import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL, profile } from "@/data/site";
import Background from "@/components/recruiter/Background";
import Contact, { Footer } from "@/components/recruiter/Contact";
import ExpandForPrint from "@/components/recruiter/ExpandForPrint";
import Experience from "@/components/recruiter/Experience";
import Floating from "@/components/recruiter/Floating";
import Header from "@/components/recruiter/Header";
import Hero from "@/components/recruiter/Hero";
import Projects from "@/components/recruiter/Projects";
import Resume from "@/components/recruiter/Resume";
import Stack from "@/components/recruiter/Stack";
import Starfield from "@/components/recruiter/Starfield";
import Ventures from "@/components/recruiter/Ventures";

// Scoped to this page: the passport keeps its own type.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const TITLE = `${profile.name} · Résumé`;
const DESCRIPTION =
  "David Czartoryski's résumé: software engineer, AI Infrastructure Researcher at Northeastern University's HPC Research Lab (MGHPCC), and founder. Mixed-vendor GPU training, Rust runtime diagnostics, gpubridge, Pawtograder, Summit Partners, and Hercules Holdings.";
// Defining openGraph here replaces the root's, file-based images included, so
// point back at the same share cards (src/app/opengraph-image.png, twitter-image.png).
const CARD = {
  width: 1200,
  height: 630,
  alt: "David Czartoryski, software engineer, founder, wrestler. 23 countries stamped. A navy passport, boarding pass, and brass alarm clock on a dark wooden table.",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/recruiter/" },
  openGraph: {
    type: "profile",
    url: `${SITE_URL}/recruiter/`,
    siteName: profile.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/opengraph-image.png", ...CARD }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/twitter-image.png", ...CARD }],
  },
};

/**
 * The recruiter view: the résumé on one page, at night. Rendered on the server
 * from src/data/site.ts; the client code is the starfield, the section index,
 * the floating buttons and the copy-email buttons. It sits outside the
 * (experience) route group, so the song, the intro and the WebGL layer never
 * load here.
 */
export default function RecruiterPage() {
  return (
    <div id="top" className={`recruiter ${geist.variable} ${geistMono.variable} relative min-h-screen`}>
      <Starfield />
      <Header />
      <main className="relative z-10 mx-auto max-w-[1152px] px-6 md:px-10">
        <Hero />
        <Experience />
        <Ventures />
        <Projects />
        <Stack />
        <Background />
        <Resume />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <Floating resume={profile.resume} />
      <ExpandForPrint />
    </div>
  );
}
