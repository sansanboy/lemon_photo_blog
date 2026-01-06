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
    output: "standalone", // 使用standalone以在Vercel上部署
    
    // 由于使用edge运行时和静态生成，不需要文件追踪
    outputFileTracing: false,
    
    experimental: {
        // 由于我们使用API路由处理数据库操作，不需要serverComponentsExternalPackages
    },
};

export default nextConfig;