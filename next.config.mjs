/** @type {import('next').NextConfig} */
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
    
    // 完全禁用输出文件追踪以避免循环引用
    outputFileTracing: false,
    
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ],
    },
    
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [
                ...(config.externals || []),
                "sharp",
                "exifr",
                "@aws-sdk",
                "argon2"
            ];
        }
        
        return config;
    }
};

export default nextConfig;