import type { Metadata } from "next";
import { SITE_URL, profile } from "@/data/site";
import Contact, { Footer } from "@/components/recruiter/Contact";
import Experience from "@/components/recruiter/Experience";
import Header from "@/components/recruiter/Header";
import Impact from "@/components/recruiter/Impact";
import Sidebar from "@/components/recruiter/Sidebar";
import TopBar from "@/components/recruiter/TopBar";
import Ventures from "@/components/recruiter/Ventures";

const TITLE = `${profile.name} · Résumé`;
const DESCRIPTION =
  "David Czartoryski's résumé: software engineer and founder at Northeastern University, graduating December 2027. Pawtograder, Mosaiq Software, Summit Partners, Whalley Computer Associates, and Hercules Holdings.";
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
 * server from src/data/site.ts; it sits outside the (experience) route group,
 * so the song, the intro and the WebGL layer never load here.
 */
export default function RecruiterPage() {
  return (
    <div className="recruiter paper min-h-screen">
      <TopBar />
      <main>
        <Header />
        <Impact />
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <Experience />
          </div>
          <div className="lg:col-span-4">
            <Sidebar />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-20">
          <Ventures />
        </div>
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
