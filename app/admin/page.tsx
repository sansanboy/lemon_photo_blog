"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading_original' | 'generating_thumbnail' | 'uploading_thumbnail' | 'extracting_exif' | 'saving_metadata'>('idle');
  const [formData, setFormData] = useState({
    title: "",
    albumId: "",
    tags: "",
    status: "PUBLISHED",
    file: null as File | null
  });
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth");
        if (res.ok) {
          setIsLoggedIn(true);
          fetchAlbums(); // 登录成功后获取相册
          fetchPhotos(); // 登录成功后获取照片
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
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error("获取相册列表失败:", error);
    }
  };

  // 获取照片列表
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
        fetchPhotos(); // 登录成功后获取照片
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_SIZE = 30 * 1024 * 1024;

      if (file.size > MAX_SIZE) {
        alert(`文件大小超过30MB，请选择更小的文件`);
        e.target.value = '';
        return;
      }

      setFormData(prev => ({ ...prev, file }));
    }
  };

  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      img.src = URL.createObjectURL(file);
    });
  };

  const extractExif = async (file: File): Promise<any | null> => {
    try {
      const exifr = (await import('exifr')).default;
      const exifData = await exifr.parse(file, true);

      if (!exifData) {
        return null;
      }

      const result: any = {
        raw: exifData,
        takenAt: null,
        camera: null,
        lens: null,
        iso: null,
        shutter: null,
        aperture: null,
        focalLength: null
      };

      if (exifData.Make && exifData.Model) {
        result.camera = `${exifData.Make} ${exifData.Model}`;
      } else if (exifData.Model) {
        result.camera = exifData.Model;
      }

      if (exifData.LensModel) {
        result.lens = exifData.LensModel;
      }

      if (typeof exifData.ISO === 'number') {
        result.iso = exifData.ISO;
      }

      if (exifData.ShutterSpeedValue) {
        const shutterValue = exifData.ShutterSpeedValue;
        if (typeof shutterValue === 'number') {
          const denominator = Math.round(1 / Math.pow(2, -shutterValue));
          result.shutter = `1/${denominator}`;
        } else {
          result.shutter = shutterValue.toString();
        }
      } else if (exifData.ExposureTime) {
        const exposureTime = exifData.ExposureTime;
        if (typeof exposureTime === 'number') {
          if (exposureTime < 1) {
            result.shutter = `1/${Math.round(1 / exposureTime)}`;
          } else {
            result.shutter = exposureTime.toString();
          }
        } else {
          result.shutter = exposureTime;
        }
      }

      if (typeof exifData.ApertureValue === 'number') {
        result.aperture = Math.round((Math.pow(2, exifData.ApertureValue / 2)) * 10) / 10;
      } else if (typeof exifData.FNumber === 'number') {
        result.aperture = Math.round(exifData.FNumber * 10) / 10;
      }

      if (typeof exifData.FocalLength === 'number') {
        result.focalLength = exifData.FocalLength;
      } else if (Array.isArray(exifData.FocalLength) && exifData.FocalLength.length >= 2) {
        result.focalLength = Math.round(exifData.FocalLength[0] / exifData.FocalLength[1]);
      }

      if (exifData.DateTimeOriginal) {
        result.takenAt = new Date(exifData.DateTimeOriginal);
      } else if (exifData.DateTime) {
        result.takenAt = new Date(exifData.DateTime);
      } else if (exifData.CreateDate) {
        result.takenAt = new Date(exifData.CreateDate);
      }

      return result;
    } catch (error) {
      console.error("读取EXIF数据时出错:", error);
      return null;
    }
  };

  const uploadFileToR2 = (file: File, presignedUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading_original');

    try {
      const file = formData.file;

      setUploadStage('uploading_original');
      const signResponse = await fetch('/api/photos/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!signResponse.ok) {
        throw new Error('Failed to get presigned URLs');
      }

      const { originalPresignedUrl, originalKey, thumbnailPresignedUrl, thumbnailKey, originalUrl, thumbnailUrl } = await signResponse.json();

      await uploadFileToR2(file, originalPresignedUrl);

      setUploadStage('generating_thumbnail');
      const thumbnailBlob = await generateThumbnail(file);
      const thumbnailFile = new File([thumbnailBlob], file.name, { type: 'image/jpeg' });

      setUploadStage('uploading_thumbnail');
      setUploadProgress(0);
      await uploadFileToR2(thumbnailFile, thumbnailPresignedUrl);

      setUploadStage('extracting_exif');
      const exifData = await extractExif(file);

      setUploadStage('saving_metadata');

      const result = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: originalUrl,
          key: originalKey,
          title: formData.title,
          albumId: formData.albumId,
          tags: formData.tags,
          thumbnailUrl,
          exifData,
          status: formData.status,
        }),
      });

      if (result.ok) {
        alert("照片上传成功！");
        setFormData({ title: "", albumId: "", tags: "", status: "PUBLISHED", file: null });
        fetchPhotos();
      } else {
        alert("照片上传失败！");
      }
    } catch (error) {
      console.error("上传错误:", error);
      alert("照片上传失败！");
    } finally {
      setUploading(false);
      setUploadStage('idle');
      setUploadProgress(0);
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

  // 删除照片
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
        // 从本地状态中移除照片
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
      {/* 添加包含登出按钮的页眉 */}
      <div className="flex justify-end py-6">
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

      {/* 添加标签页切换 */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('upload')}
        >
          照片上传
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'manage' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('manage')}
        >
          照片管理
        </button>
      </div>

      {activeTab === 'upload' && (
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
                <label className="block text-sm text-gray-700 mb-2">照片状态</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="DRAFT">待发布</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="ARCHIVED">下线</option>
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

              {uploading && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {uploadStage === 'uploading_original' && '上传原图...'}
                      {uploadStage === 'generating_thumbnail' && '生成缩略图...'}
                      {uploadStage === 'uploading_thumbnail' && '上传缩略图...'}
                      {uploadStage === 'extracting_exif' && '提取EXIF数据...'}
                      {uploadStage === 'saving_metadata' && '保存元数据...'}
                    </span>
                    <span className="text-sm font-medium text-blue-900">
                      {uploadStage === 'uploading_original' || uploadStage === 'uploading_thumbnail'
                        ? `${uploadProgress.toFixed(0)}%`
                        : ''}
                    </span>
                  </div>
                  {(uploadStage === 'uploading_original' || uploadStage === 'uploading_thumbnail') && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  {(uploadStage === 'generating_thumbnail' || uploadStage === 'extracting_exif' || uploadStage === 'saving_metadata') && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              )}

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
      )}

      {activeTab === 'manage' && (
        <div className="card p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">照片管理</h2>
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
                        <img 
                          src={photo.thumbnailUrl} 
                          alt={photo.title || "照片"} 
                          className="h-12 w-12 object-cover rounded"
                        />
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
      )}
    </div>
  );
}