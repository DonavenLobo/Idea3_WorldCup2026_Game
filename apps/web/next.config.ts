import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@world-cup-game/config", "@world-cup-game/types"]
};

export default nextConfig;
