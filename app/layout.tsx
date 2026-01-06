import type { Metadata } from "next";
import "./globals.css";
import AuthNavbar from "@/components/AuthNavbar";

export const runtime = 'edge';

export const metadata: Metadata = {
    title: "大军摄影作品集",
    description: "大军摄影个人作品展示与相册浏览",
    openGraph: {
        title: "大军摄影作品集",
        description: "浏览高质量摄影作品，相册与标签分类。",
        url: "https://example.com",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "大军摄影作品集",
        description: "浏览高质量摄影作品，相册与标签分类。",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 在edge运行时中，我们使用客户端组件处理认证状态
    return (
        <html lang="zh-CN">
            <body className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
                <AuthNavbar />
                <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
            </body>
        </html>
    );
}