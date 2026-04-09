import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose Vercel deploy environment to the browser for Mixpanel token selection (prod vs dev project).
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
