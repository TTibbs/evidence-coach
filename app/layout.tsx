import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "Evidence Coach",
  description:
    "Turn your real experience into stronger CV evidence and interview answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body className={`${fraunces.variable} ${sourceSans.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
