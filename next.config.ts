import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.0.108", "localhost:3000"],
  images: {
    // Skip next/image's optimizer for local logos so they always render on hosts
    // that don't serve /_next/image?url=... reliably (Netlify Edge, etc.).
    // The PNGs are already small (< 500 KB) so no CDN resizing is needed.
    unoptimized: true,
  },
};

export default nextConfig;

