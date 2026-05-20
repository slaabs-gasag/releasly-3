import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/projects",        destination: `${backendUrl}/api/projects` },
      { source: "/api/projects/:path*", destination: `${backendUrl}/api/projects/:path*` },
      { source: "/api/stats",           destination: `${backendUrl}/api/stats` },
      { source: "/api/health",          destination: `${backendUrl}/api/health` },
    ];
  },
};

export default nextConfig;
