import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { Footer } from "@/components/footer";

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
        <main className="flex-1 container py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
