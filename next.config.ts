import type { NextConfig } from "next";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Increase API response size limit
  serverExternalPackages: ["cheerio"],
};

export default nextConfig;
