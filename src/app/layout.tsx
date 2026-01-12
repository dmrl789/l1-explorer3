import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/utilities.css";
import { TopNav } from "@/components/top-nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IPPAN L1 Explorer | DevNet",
  description: "IPPAN L1 DevNet Explorer - HashTimer™ ordering, IPPAN Time, deterministic finality",
  keywords: ["IPPAN", "L1", "blockchain", "explorer", "DevNet", "HashTimer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <TopNav />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 py-10 text-xs text-muted-foreground border-t border-border">
          IPPAN L1 Explorer — DevNet — L1 only.
        </footer>
      </body>
    </html>
  );
}
