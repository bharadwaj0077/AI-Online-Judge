import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext"; // <-- 1. Import the manager
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SynapseJudge | AI Coding Sandbox Workspace",
  description: "Next-Generation Sandboxed Automated Code Evaluation Engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30`}>
        {/* 2. Wrap everything to pass the session states downward */}
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}