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

    // 禁用输出文件追踪以避免RangeError: Maximum call stack size exceeded
    outputFileTracing: false,
    
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ],
    },
    
    // 使用webpack配置处理外部依赖
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