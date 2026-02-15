import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Avoids AbortError from double-mount in dev (fetch/async aborted on unmount)
};

export default nextConfig;
