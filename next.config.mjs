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
    
    // 添加额外配置以避免Vercel部署问题
    experimental: {
        serverComponentsExternalPackages: [
            "sharp",
            "exifr",
            "@aws-sdk",
            "argon2"
        ]
    }
};

export default nextConfig;