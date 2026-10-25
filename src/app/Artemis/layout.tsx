import { Archivo, Martian_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

export default function ArtemisLayout({ children }: { children: React.ReactNode }) {
  return <div id="top" className={`artemis ${archivo.variable} ${martian.variable} min-h-screen`}>{children}</div>;
}
