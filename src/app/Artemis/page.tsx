import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { SITE_URL } from "@/data/site";
import { artemis } from "@/data/artemis";
import About from "@/components/artemis/About";
import Bridge from "@/components/artemis/Bridge";
import Detector from "@/components/artemis/Detector";
import Evidence from "@/components/artemis/Evidence";
import Feedback, { Footer } from "@/components/artemis/Feedback";
import Header from "@/components/artemis/Header";
import Hero from "@/components/artemis/Hero";
import Problem from "@/components/artemis/Problem";
import Research from "@/components/artemis/Research";
import Story from "@/components/artemis/Story";
import Transport from "@/components/artemis/Transport";

// Scoped to this page, like the recruiter view's Geist.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

const TITLE = `${artemis.name} · GPU performance regressions in distributed training`;
const DESCRIPTION =
  "Artemis finds GPU performance regressions in distributed PyTorch training while the job runs, on NVIDIA, AMD or both: it flags the slow rank, link or island, estimates the cost per step and can rebalance work on opt-in. GPUBridge, its MIT-licensed companion, runs NVIDIA and AMD GPUs in one PyTorch job. By David Czartoryski.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: artemis.founder, url: SITE_URL }],
  keywords: [
    "GPU performance regression",
    "straggler detection",
    "distributed training",
    "NCCL",
    "RCCL",
    "RDMA",
    "InfiniBand",
    "mixed-vendor GPU training",
    "GPUBridge",
    "PyTorch",
  ],
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
 * /Artemis: the project page for Artemis and GPUBridge. Server rendered from
 * src/data/artemis.ts; the client code is the section index, the regression
 * chart and the copy-email button. Outside the (experience) route group, so
 * the song, the intro and the WebGL layer never load here.
 */
export default function ArtemisPage() {
  return (
    <div id="top" className={`artemis ${archivo.variable} ${martian.variable} min-h-screen`}>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Problem />
        <Story />
        <Bridge />
        <Transport />
        <Detector />
        <Evidence />
        <Research />
        <About />
        <Feedback />
      </main>
      <Footer />
    </div>
  );
}
