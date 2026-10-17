import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nearshoreadventures.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Nearshore Adventures | Cape Cod events, by land or by sea",
    template: "%s | Nearshore Adventures",
  },
  description:
    "Concerts, festivals, food, art, classes and community events across all 15 Cape Cod towns. Updated every few days, all year round.",
  openGraph: {
    siteName: "Nearshore Adventures",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <Header />
        <main>{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
