import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js'],
  allowedDevOrigins: ['192.168.29.120', '192.168.29.*'],
};

export default nextConfig;
