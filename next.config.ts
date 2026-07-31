import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf.js out of the Next server bundle so its worker file resolves.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
