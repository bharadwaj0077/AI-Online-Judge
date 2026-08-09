import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SynapseJudge - Intelligent Coding Platform",
  description: "Automated code evaluation and AI mentorship sandbox",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090b] text-zinc-100 min-h-screen antialiased`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}