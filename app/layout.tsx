import "./globals.css";
import AuthNavbar from "@/components/AuthNavbar";


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