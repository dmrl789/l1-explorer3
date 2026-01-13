import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/utilities.css";
import { TopNav } from "@/components/top-nav";
import { Footer } from "@/components/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IPPAN Explorer | DevNet",
  description: "IPPAN L1 DevNet Explorer - HashTimer ordering, IPPAN Time, deterministic finality",
  keywords: ["IPPAN", "L1", "blockchain", "explorer", "DevNet", "HashTimer"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#131a24] text-slate-100 antialiased font-sans`}>
        <div className="min-h-screen bg-gradient-to-b from-[#131a24] via-[#151c28] to-[#131a24]">
          <TopNav />
          <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 lg:pb-12 lg:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
