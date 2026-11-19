import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Chat photos are resized client-side; 5mb leaves room for the 4 MB file cap plus form fields.
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
