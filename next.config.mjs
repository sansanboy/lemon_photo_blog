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

    // 使用默认的outputFileTracing行为，不显式设置
    // outputFileTracing: true,  // 注释掉，使用默认值
    
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ],
        typedRoutes: false,
    },
    
    // 通过webpack配置处理外部依赖
    webpack: (config, { isServer }) => {
        if (isServer) {
            // 避免在服务器端打包这些包
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