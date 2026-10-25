import Link from "next/link";
import { artemis, mailto } from "@/data/artemis";
import { Container } from "./bits";
import Mark from "./Mark";

export default function Header({ product = false }: { product?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-ar-line bg-ar-bg/90 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-full focus:bg-ar-fg focus:px-4 focus:py-2 focus:text-[13px] focus:text-ar-bg">
        Skip to content
      </a>
      <Container className="flex h-[76px] items-center justify-between gap-4">
        <Link href="/Artemis/" className="flex shrink-0 items-center gap-2.5 text-ar-fg" aria-label="Artemis home">
          <Mark size={26} />
          <span className="ar-wide text-[14px] font-semibold tracking-[0.16em]">ARTEMIS</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 sm:gap-7">
          <Link href="/Artemis/product/" aria-current={product ? "page" : undefined} className="py-3 text-[13px] text-ar-muted transition-colors hover:text-ar-fg aria-[current]:text-ar-fg sm:text-[14px]">
            Product
          </Link>
          <Link href="/Artemis/product/#about" className="hidden py-3 text-[14px] text-ar-muted transition-colors hover:text-ar-fg sm:block">About</Link>
          <a href={mailto("Artemis: let's talk")} className="inline-flex min-h-10 items-center rounded-full bg-ar-fg px-4 text-[13px] font-medium text-ar-bg transition-opacity hover:opacity-85 sm:px-5 sm:text-[14px]">
            Let&apos;s talk <span aria-hidden="true" className="ml-2">↗</span>
          </a>
        </nav>
      </Container>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ar-line">
      <Container className="flex flex-col gap-5 py-8 text-[12px] text-ar-faint sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Artemis · Founded by {artemis.founder}</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/Artemis/product/" className="hover:text-ar-fg">Product</Link>
          <a href={artemis.github} className="hover:text-ar-fg">GPUBridge ↗</a>
          <a href={mailto("Artemis: let's talk")} className="hover:text-ar-fg">Contact</a>
        </nav>
      </Container>
    </footer>
  );
}
