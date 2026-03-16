import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PageForge - AI Product Page Generator",
  description:
    "Generate high-converting Shopify product pages from any product URL. Supports Shopify, AliExpress, and Amazon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
