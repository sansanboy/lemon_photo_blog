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

    // 重新启用输出文件追踪，但使用更精确的排除规则
    outputFileTracing: true,
    
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ],
        // 确保使用最新的RSC功能配置
        serverComponentsHmrForcedExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ]
    },
    
    // 精确排除可能引起问题的文件
    outputFileTracingIncludes: {
        "app/api/**/*": [
            "./node_modules/sharp/**/*",
            "./node_modules/@aws-sdk/**/*",
            "./node_modules/argon2/**/*",
            "./node_modules/exifr/**/*"
        ]
    }
};

export default nextConfig;