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

    // 启用输出文件追踪以确保Vercel部署时包含所有必要文件
    outputFileTracing: true,
    
    // 添加额外配置以避免循环引用问题
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ],
        // 禁用某些可能导致循环引用的实验性功能
        typedRoutes: false,
    },
    
    // 排除可能引起问题的文件类型
    outputFileTracingExcludes: {
        "*": [
            "node_modules/@swc/**/*",
            "node_modules/@next/env",
            "node_modules/webpack/**/*"
        ]
    }
};

export default nextConfig;