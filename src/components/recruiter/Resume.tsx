import { profile } from "@/data/site";
import { SectionHead } from "./bits";
import { ArrowOut, Download } from "./icons";

/** The PDF itself, for anyone who wants the one-pager rather than the page. */
export default function Resume() {
  return (
    <section id="resume" aria-labelledby="resume-h" className="no-print scroll-mt-28 pt-32 md:pt-40">
      <SectionHead id="resume" n="07" kicker="Résumé" title="Résumé PDF" />
      <div className="mb-6 flex flex-wrap gap-3">
        <a
          href={profile.resume}
          download
          className="inline-flex h-11 items-center gap-2.5 rounded-full bg-cv-accent px-5 text-[14px] font-medium text-cv-accent-ink shadow-[0_10px_30px_-8px_rgb(242_169_59/0.55)] transition-[filter] hover:brightness-110"
        >
          <Download /> Download PDF
        </a>
        <a
          href={profile.resume}
          target="_blank"
          rel="noopener"
          className="inline-flex h-11 items-center gap-2.5 rounded-full border border-cv-line-2 bg-white/[0.02] px-5 text-[14px] text-cv-fg transition-colors hover:border-cv-fg/30"
        >
          <ArrowOut /> Open in a new tab
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-cv-line-2 bg-cv-card p-2 sm:p-3">
        <iframe
          src={`${profile.resume}#view=FitH&toolbar=0`}
          title={`${profile.name}'s résumé (PDF)`}
          loading="lazy"
          className="aspect-[8.5/11] max-h-[1100px] w-full rounded-xl bg-white"
        />
      </div>
    </section>
  );
}
