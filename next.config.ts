import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  // The bundled start list (seed/) is read from disk by the import action, and the
  // serverless Chromium binary must travel with the functions that take snapshots.
  outputFileTracingIncludes: {
    "/**": ["./seed/**/*", "./node_modules/@sparticuz/chromium/bin/**"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
    qualities: [78],
  },
};

export default nextConfig;
