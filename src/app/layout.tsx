import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuildOS | Construction Operations",
  description: "Simple project and business operations management for construction teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <a
          href="/help"
          className="fixed bottom-5 right-5 z-50 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-blue-200 hover:text-blue-700"
          aria-label="Open BuildOS Help Center"
        >
          Help
        </a>
      </body>
    </html>
  );
}
