import "./globals.css";
import AuthNavbar from "@/components/AuthNavbar";


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body className="min-h-screen bg-gradient-to-b from-[#F5F0E8] to-[#FAF7F2]">
                <AuthNavbar />
                <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
            </body>
        </html>
    );
}