"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    albumId: "",
    tags: "",
    file: null as File | null
  });
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth");
        if (res.ok) {
          setIsLoggedIn(true);
          fetchAlbums(); // 登录成功后获取相册
        } else {
          setIsLoggedIn(false);
        }
      } catch (e) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  // 获取相册列表
  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch (error) {
      console.error("获取相册列表失败:", error);
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
        fetchAlbums(); // 登录成功后获取相册
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

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // 提交照片上传
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;
    
    setUploading(true);
    
    const data = new FormData();
    data.append("file", formData.file);
    if (formData.title) data.append("title", formData.title);
    if (formData.albumId) data.append("albumId", formData.albumId);
    if (formData.tags) data.append("tags", formData.tags);
    
    try {
      const result = await fetch("/api/photos", {
        method: "POST",
        body: data,
      });
      
      if (result.ok) {
        alert("照片上传成功！");
        setFormData({ title: "", albumId: "", tags: "", file: null });
      } else {
        alert("照片上传失败！");
      }
    } catch (error) {
      console.error("上传错误:", error);
      alert("照片上传失败！");
    } finally {
      setUploading(false);
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

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="page-title">管理后台</h1>
        <p className="page-subtitle">上传和管理您的照片</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* 相册管理 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">创建新相册</h2>
          <div className="flex gap-3 mb-8">
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

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">现有相册</h2>
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

        {/* 照片上传 */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">上传照片</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-2">照片标题</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="可选"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">选择相册</label>
              <select
                name="albumId"
                value={formData.albumId}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">不放入相册</option>
                {albums.map(album => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">标签 (逗号分隔)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="form-input"
                placeholder="风景,自然,人像"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">选择照片</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !formData.file}
              className={`w-full btn py-3.5 ${
                uploading || !formData.file
                  ? "bg-gray-200 cursor-not-allowed text-gray-500"
                  : "btn-primary"
              }`}
            >
              {uploading ? "上传中..." : "上传照片"}
            </button>
          </form>
        </div>
      </div>

      <div className="card p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">账户管理</h2>
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
  );
}