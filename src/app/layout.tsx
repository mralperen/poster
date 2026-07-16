import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { CartProvider } from "@/context/CartContext";
import { brand } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...buildMetadata(),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: brand.shortName,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#09090a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { general } = await getSiteContent();

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#09090a] font-sans text-zinc-100">
        <SiteJsonLd />
        <CartProvider
          pricing={{
            shippingFee: general.shippingFee,
            freeShippingThreshold: general.freeShippingThreshold,
            bundleSecondPercent: general.bundleSecondPercent,
            bundleThirdPercent: general.bundleThirdPercent,
          }}
        >
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
