import type { Metadata } from "next";
import "./globals.css";
import { CommishProvider } from "@/components/CommishProvider";
import { Sidebar } from "@/components/Sidebar";
import { NewsTicker } from "@/components/NewsTicker";

export const metadata: Metadata = {
  title: "Cleveland Guys Fantasy Football",
  description:
    "Home base for the Cleveland Guys fantasy football league — rules, records, trades, punishments, and live ESPN standings & scores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CommishProvider>
          <div className="cg-shell">
            <Sidebar />
            <main className="cg-main cg-scroll">
              <NewsTicker />
              <div className="cg-content">{children}</div>
            </main>
          </div>
        </CommishProvider>
      </body>
    </html>
  );
}
