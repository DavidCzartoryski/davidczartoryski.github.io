"use client";

import { useEffect } from "react";

/** Paper has no "More" button: open every fold for printing, then put them back. */
export default function ExpandForPrint() {
  useEffect(() => {
    const open = () =>
      document.querySelectorAll<HTMLDetailsElement>(".recruiter details:not([open])").forEach((d) => {
        d.dataset.printOpened = "";
        d.open = true;
      });
    const close = () =>
      document.querySelectorAll<HTMLDetailsElement>(".recruiter details[data-print-opened]").forEach((d) => {
        delete d.dataset.printOpened;
        d.open = false;
      });
    window.addEventListener("beforeprint", open);
    window.addEventListener("afterprint", close);
    return () => {
      window.removeEventListener("beforeprint", open);
      window.removeEventListener("afterprint", close);
    };
  }, []);
  return null;
}
