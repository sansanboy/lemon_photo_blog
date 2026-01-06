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
        typedRoutes: false,
    },
    
    // 使用webpack配置来确保依赖被正确处理
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [
                ...config.externals,
                /node_modules\/(sharp|exifr|@aws-sdk|argon2)/
            ];
        }
        return config;
    }
};

export default nextConfig;