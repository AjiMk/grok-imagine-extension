import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "grok-imagine",
  description: "Initial Next.js structure for grok imagine."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
