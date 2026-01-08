const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    output: "standalone",
    experimental: {
        serverComponentsExternalPackages: ["sharp"],
    },
};

export default nextConfig;