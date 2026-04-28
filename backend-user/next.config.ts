import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-backend-user",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;