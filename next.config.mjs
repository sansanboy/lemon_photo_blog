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
    outputFileTracing: true,
    outputFileTracingExcludes: {
        "*": [
            "**/.git/**",
            "**/.next/**",
            "**/node_modules/**",
            "**/prisma/migrations/**",
        ],
    },
};

export default nextConfig;
