import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["recharts"],
  serverExternalPackages: ["bcryptjs"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "framer-motion",
      "@prisma/client",
    ],
    staleTimes: {
      // Cache client-side navigations for 5 min (dynamic) / 3 min (static)
      dynamic: 300,
      static: 180,
    },
  },
};

export default nextConfig;
