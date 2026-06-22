import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境压缩
  compress: true,

  // 图片自动优化（转 WebP/AVIF + 懒加载）
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 86400,
  },

  // 安全 & 性能头（middleware 覆盖更多）
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
      ],
    },
  ],

  // 导出静态优化提示
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
