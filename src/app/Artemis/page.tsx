import type { Metadata } from "next";
import { SITE_URL } from "@/data/site";
import { artemis } from "@/data/artemis";
import Header, { Footer } from "@/components/artemis/Header";
import Hero from "@/components/artemis/Hero";
import Homepage from "@/components/artemis/Homepage";

const TITLE = `${artemis.name} · Your autonomous performance engineer`;
const DESCRIPTION =
  "An autonomous performance engineer for distributed AI training. Artemis is being built to reduce wasted GPU time and the engineering effort spent finding and fixing slowdowns.";

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

/** A short product introduction. Technical depth lives at /Artemis/product/. */
export default function ArtemisPage() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Homepage />
      </main>
      <Footer />
    </>
  );
}
