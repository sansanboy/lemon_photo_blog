import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "独立摄影师作品集",
  description: "独立摄影师个人作品展示与相册浏览",
  openGraph: {
    title: "独立摄影师作品集",
    description: "浏览高质量摄影作品，相册与标签分类。",
    url: "https://example.com",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "独立摄影师作品集",
    description: "浏览高质量摄影作品，相册与标签分类。"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = isAdmin();

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
        <Navbar isAdmin={admin} />
        <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>
      </body>
    </html>
  );
}