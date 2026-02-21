import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Avoids AbortError from double-mount in dev (fetch/async aborted on unmount)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
