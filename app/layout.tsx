import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primary Care Trees",
  description:
    "A speculative medical network that matches New Yorkers with nearby tree providers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
