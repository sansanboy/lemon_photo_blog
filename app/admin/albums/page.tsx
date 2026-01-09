"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth");
        if (res.ok) {
          setIsLoggedIn(true);
          fetchAlbums();
        } else {
          setIsLoggedIn(false);
          router.push("/admin");
        }
      } catch (e) {
        setIsLoggedIn(false);
        router.push("/admin");
      }
    };
    checkAuth();
  }, [router]);

  // 获取相册列表
  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error("获取相册列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新相册
  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) return;

    const response = await fetch("/api/albums", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: newAlbumTitle }),
    });

    if (response.ok) {
      setNewAlbumTitle("");
      fetchAlbums();
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
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-between items-center py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回管理面板
          </button>
          <h1 className="text-2xl font-bold text-gray-900">相册管理</h1>
        </div>
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

      <div className="grid grid-cols-1 gap-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            创建新相册
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="输入相册标题"
              className="form-input flex-1"
            />
            <button
              onClick={createAlbum}
              className="btn btn-primary whitespace-nowrap"
            >
              创建
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V5zM14 7a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V7zM2 13a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4zM14 15a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            现有相册
          </h2>
          {albums.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无相册</p>
          ) : (
            <ul className="space-y-4">
              {albums.map(album => (
                <li
                  key={album.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-900">{album.title}</span>
                  <span className="text-sm text-gray-500">{album.photos?.length || 0} 张照片</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
