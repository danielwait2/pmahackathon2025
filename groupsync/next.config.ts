import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      tailwindcss: require.resolve("tailwindcss"),
    },
  },
};

export default nextConfig;
