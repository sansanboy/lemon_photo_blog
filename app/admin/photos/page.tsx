"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/check-auth");
        if (res.ok) {
          setIsLoggedIn(true);
          await Promise.all([fetchPhotos(), fetchAlbums()]);
        } else {
          setIsLoggedIn(false);
          router.push("/admin");
        }
      } catch (e) {
        setIsLoggedIn(false);
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const initialStates: Record<string, boolean> = {};
    photos.forEach(photo => {
      initialStates[photo.id] = true;
    });
    setImageLoadingStates(initialStates);
  }, [photos]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/photos?status=");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error("获取照片列表失败:", error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error("获取相册列表失败:", error);
    }
  };

  const updatePhotoStatus = async (photoId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/photos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: photoId, status: newStatus }),
      });

      if (response.ok) {
        setPhotos(photos.map(photo =>
          photo.id === photoId ? { ...photo, status: newStatus } : photo
        ));
        alert("照片状态更新成功！");
      } else {
        alert("更新照片状态失败！");
      }
    } catch (error) {
      console.error("更新状态错误:", error);
      alert("更新照片状态失败！");
    }
  };

  const updatePhotoAlbum = async (photoId: string, newAlbumId: string) => {
    try {
      const response = await fetch("/api/photos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: photoId, albumId: newAlbumId || null }),
      });

      if (response.ok) {
        setPhotos(photos.map(photo => {
          if (photo.id === photoId) {
            const album = albums.find(a => a.id === newAlbumId);
            return { ...photo, albumId: newAlbumId, album: album ? { id: album.id, title: album.title } : null };
          }
          return photo;
        }));
        alert("照片相册更新成功！");
      } else {
        alert("更新照片相册失败！");
      }
    } catch (error) {
      console.error("更新相册错误:", error);
      alert("更新照片相册失败！");
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!window.confirm("确定要删除这张照片吗？")) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setPhotos(photos.filter(photo => photo.id !== photoId));
        alert("照片删除成功！");
      } else {
        alert("删除照片失败！");
      }
    } catch (error) {
      console.error("删除照片错误:", error);
      alert("删除照片失败！");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  const handleImageLoad = (photoId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [photoId]: false }));
  };

  const handleImageError = (photoId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [photoId]: false }));
  };

  if (!isLoggedIn) {
    return null;
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
          <h1 className="text-2xl font-bold text-gray-900">照片管理</h1>
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

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          照片列表
        </h2>
        {photos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无照片</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">缩略图</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相册</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {photos.map(photo => (
                   <tr key={photo.id}>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                         {imageLoadingStates[photo.id] && (
                           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                         )}
                         <img
                           src={photo.thumbnailUrl}
                           alt={photo.title || "照片"}
                           className={`h-12 w-12 object-cover rounded ${imageLoadingStates[photo.id] ? 'hidden' : ''}`}
                           onLoad={() => handleImageLoad(photo.id)}
                           onError={() => handleImageError(photo.id)}
                         />
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{photo.title || "无标题"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={photo.albumId || ""}
                        onChange={(e) => updatePhotoAlbum(photo.id, e.target.value)}
                        className="text-sm rounded px-2 py-1 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">未分类</option>
                        {albums.map(album => (
                          <option key={album.id} value={album.id}>
                            {album.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {photo.tags.map((tag: any) => tag.tag.name).join(', ') || "无标签"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={photo.status}
                        onChange={(e) => updatePhotoStatus(photo.id, e.target.value)}
                        className={`text-sm rounded px-2 py-1 ${
                          photo.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : photo.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="DRAFT">待发布</option>
                        <option value="PUBLISHED">已发布</option>
                        <option value="ARCHIVED">下线</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
