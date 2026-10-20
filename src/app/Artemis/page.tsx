import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { SITE_URL } from "@/data/site";
import { artemis } from "@/data/artemis";
import Bridge from "@/components/artemis/Bridge";
import Contact, { Footer } from "@/components/artemis/Contact";
import Evidence from "@/components/artemis/Evidence";
import Fit from "@/components/artemis/Fit";
import Founders from "@/components/artemis/Founders";
import Header from "@/components/artemis/Header";
import Hero from "@/components/artemis/Hero";
import Market from "@/components/artemis/Market";
import Problem from "@/components/artemis/Problem";
import Product from "@/components/artemis/Product";

// Scoped to this page, like the recruiter view's Geist.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

const TITLE = `${artemis.name} · ${artemis.tagline}`;
const DESCRIPTION =
  "Artemis finds the slow GPU, slow link or hung rank in a distributed training job while it runs, on NVIDIA, AMD or both. GPUBridge, its open-source PyTorch backend, runs NVIDIA and AMD GPUs in one job. Built by David Czartoryski, Thomas Czartoryski and Ali Younes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/Artemis/" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/Artemis/`,
    siteName: artemis.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * /Artemis: the venture page for the straggler detector and GPUBridge. Server
 * rendered from src/data/artemis.ts; the only client code is the cost
 * calculator and the copy-email button. Outside the (experience) route group,
 * so the song, the intro and the WebGL layer never load here.
 */
export default function ArtemisPage() {
  return (
    <div id="top" className={`artemis ${archivo.variable} ${martian.variable} min-h-screen`}>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Product />
        <Bridge />
        <Evidence />
        <Fit />
        <Market />
        <Founders />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
