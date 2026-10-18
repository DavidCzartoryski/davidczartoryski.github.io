import type { Metadata } from "next";
import { SITE_URL, profile } from "@/data/site";
import Background from "@/components/recruiter/Background";
import Contact, { Footer } from "@/components/recruiter/Contact";
import Experience from "@/components/recruiter/Experience";
import Overview from "@/components/recruiter/Overview";
import Projects from "@/components/recruiter/Projects";
import Rail from "@/components/recruiter/Rail";
import TopBar from "@/components/recruiter/TopBar";
import Ventures from "@/components/recruiter/Ventures";

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
 * The recruiter view: the résumé on one quiet page. Rendered entirely on the
 * server from src/data/site.ts (the section index and copy-email buttons are
 * the only client code); it sits outside the (experience) route group, so the
 * song, the intro and the WebGL layer never load here.
 */
export default function RecruiterPage() {
  return (
    <div id="top" className="recruiter min-h-screen">
      <TopBar />
      <div className="mx-auto max-w-[1360px] lg:flex">
        <Rail />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[880px] px-6 pt-12 lg:px-12 lg:pt-16 xl:px-16">
            <Overview />
            <Experience />
            <Ventures />
            <Projects />
            <Background />
            <Contact />
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
