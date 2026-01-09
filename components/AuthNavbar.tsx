'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuthNavbar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 检查认证状态
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        setIsAdmin(data.isAdmin || false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo/apple-touch-icon.png"
            alt="大军摄影 Logo"
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-md"
          />
          <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[#6B5344] to-[#A69270] bg-clip-text text-transparent">
            大军摄影作品集
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-gray-700 hover:text-gray-900 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100"
          >
            首页
          </Link>
          <Link
            href="/albums"
            className="text-gray-700 hover:text-gray-900 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100"
          >
            相册
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-gray-700 hover:text-gray-900 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100"
            >
              管理后台
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}