const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: process.env.R2_PUBLIC_DOMAIN || "**",
        },
      ],
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [320, 640, 750, 828, 1080, 1200, 1920],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 640, 1024],
    },
    swcMinify: true,
    experimental: {
      serverComponentsExternalPackages: ["sharp"],
      optimizeCss: true,
    },
    generateEtags: true,
    productionBrowserSourceMaps: false,
};

export default nextConfig;

export default nextConfig;