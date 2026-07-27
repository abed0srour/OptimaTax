import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the user's home directory
  // otherwise makes Next.js infer the wrong project root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
