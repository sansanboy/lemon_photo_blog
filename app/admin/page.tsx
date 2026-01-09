"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({ albums: 0, photos: 0, published: 0, draft: 0 });
  const [loading, setLoading] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth");
        if (res.ok) {
          setIsLoggedIn(true);
          fetchStats();
        } else {
          setIsLoggedIn(false);
        }
      } catch (e) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [albumsRes, photosRes] = await Promise.all([
        fetch("/api/albums"),
        fetch("/api/photos?status="),
      ]);

      if (albumsRes.ok && photosRes.ok) {
        const albumsData = await albumsRes.json();
        const photosData = await photosRes.json();
        const photos = photosData.photos || [];

        setStats({
          albums: albumsData.albums?.length || 0,
          photos: photos.length,
          published: photos.filter((p: any) => p.status === 'PUBLISHED').length,
          draft: photos.filter((p: any) => p.status === 'DRAFT').length,
        });
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        setError("");
        fetchStats();
      } else {
        setError("用户名或密码错误");
      }
    } catch (error) {
      setError("登录失败，请重试");
    }
  };

  // 登出处理
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl mt-20 shadow-2xl border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient">管理员登录</h1>
          <p className="text-gray-500 mt-2">请输入您的凭据</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              className="form-input"
              placeholder="输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="form-input"
              placeholder="输入密码"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full btn btn-primary py-3"
          >
            登录
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center py-6">
        <h1 className="text-2xl font-bold text-gray-900">管理面板</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/upload")}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            上传照片
          </button>
          <button
            onClick={() => router.push("/admin/albums")}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V5zM14 7a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V7zM2 13a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4zM14 15a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            相册管理
          </button>
          <button
            onClick={() => router.push("/admin/photos")}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            照片管理
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-danger inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            退出登录
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          统计概览
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">{stats.albums}</div>
            <div className="text-sm text-gray-600">相册数量</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-3xl font-bold text-green-600">{stats.photos}</div>
            <div className="text-sm text-gray-600">照片总数</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">{stats.published}</div>
            <div className="text-sm text-gray-600">已发布</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">待发布</div>
          </div>
        </div>
      </div>
    </div>
  );
}