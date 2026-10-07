import type { Metadata } from "next";
import { Caveat, Figtree, Young_Serif } from "next/font/google";
import "./globals.css";

const display = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "Sous · Your AI cooking companion",
  description: "Hands-free, step-by-step cooking guidance you can talk to.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <body className="bg-cream text-ink font-body antialiased">{children}</body>
    </html>
  );
}
