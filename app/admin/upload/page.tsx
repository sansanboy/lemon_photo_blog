"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading_original' | 'generating_thumbnail' | 'uploading_thumbnail' | 'extracting_exif' | 'saving_metadata'>('idle');
  const [uploadResults, setUploadResults] = useState<{ success: string[], failed: { filename: string, error: string }[] }>({ success: [], failed: [] });
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  type PhotoFileItem = {
    file: File;
    title: string;
    tags: string;
  };

  const [formData, setFormData] = useState({
    albumId: "",
    status: "PUBLISHED",
    files: [] as PhotoFileItem[]
  });

  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const MAX_SIZE = 30 * 1024 * 1024;

      const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SIZE);
      if (oversizedFiles.length > 0) {
        alert(`以下文件超过30MB限制：\n${oversizedFiles.map(f => f.name).join('\n')}`);
        e.target.value = '';
        return;
      }

      const photoItems: PhotoFileItem[] = selectedFiles.map(file => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        tags: ""
      }));

      setFormData(prev => ({ ...prev, files: [...prev.files, ...photoItems] }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

    if (droppedFiles.length === 0) {
      alert('请拖放图片文件');
      return;
    }

    const MAX_SIZE = 30 * 1024 * 1024;
    const oversizedFiles = droppedFiles.filter(file => file.size > MAX_SIZE);

    if (oversizedFiles.length > 0) {
      alert(`以下文件超过30MB限制：\n${oversizedFiles.map(f => f.name).join('\n')}`);
      return;
    }

    const photoItems: PhotoFileItem[] = droppedFiles.map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      tags: ""
    }));

    setFormData(prev => ({ ...prev, files: [...prev.files, ...photoItems] }));
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoTitleChange = (index: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.map((item, i) =>
        i === index ? { ...item, title } : item
      )
    }));
  };

  const handlePhotoTagsChange = (index: number, tags: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.map((item, i) =>
        i === index ? { ...item, tags } : item
      )
    }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({ ...prev, files: [] }));
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

  const uploadFileToR2 = (file: File, presignedUrl: string, onProgress?: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        } else if (event.lengthComputable) {
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
    if (formData.files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading_original');
    setUploadResults({ success: [], failed: [] });
    setCurrentFileIndex(0);

    for (let i = 0; i < formData.files.length; i++) {
      const photoItem = formData.files[i];
      const file = photoItem.file;
      setCurrentFileIndex(i);

      try {
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

        const totalFiles = formData.files.length;
        const fileProgressStart = (i / totalFiles) * 100;

        await uploadFileToR2(file, originalPresignedUrl, (progress) => {
          const overallProgress = fileProgressStart + (progress / 100) * (100 / totalFiles);
          setUploadProgress(overallProgress);
        });

        setUploadStage('generating_thumbnail');
        const thumbnailBlob = await generateThumbnail(file);
        const thumbnailFile = new File([thumbnailBlob], file.name, { type: 'image/jpeg' });

        setUploadStage('uploading_thumbnail');
        setUploadProgress(fileProgressStart + (50 / totalFiles));
        await uploadFileToR2(thumbnailFile, thumbnailPresignedUrl, (progress) => {
          const overallProgress = fileProgressStart + (50 / totalFiles) + (progress / 100) * (50 / totalFiles);
          setUploadProgress(overallProgress);
        });

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
            title: photoItem.title || file.name,
            albumId: formData.albumId,
            tags: photoItem.tags,
            thumbnailUrl,
            exifData,
            status: formData.status,
          }),
        });

        if (result.ok) {
          setUploadResults(prev => ({
            ...prev,
            success: [...prev.success, file.name]
          }));
        } else {
          throw new Error('Failed to save metadata');
        }
      } catch (error) {
        console.error(`上传 ${file.name} 失败:`, error);
        setUploadResults(prev => ({
          ...prev,
          failed: [...prev.failed, { filename: file.name, error: error instanceof Error ? error.message : 'Unknown error' }]
        }));
      }
    }

    setUploading(false);
    setUploadStage('idle');
    setUploadProgress(0);
    setCurrentFileIndex(0);

    const successCount = uploadResults.success.length;
    const failedCount = uploadResults.failed.length;

    if (failedCount === 0) {
      alert(`成功上传 ${successCount} 张照片！`);
    } else {
      alert(`上传完成：成功 ${successCount} 张，失败 ${failedCount} 张\n\n失败文件：\n${uploadResults.failed.map(f => f.filename).join('\n')}`);
    }

    setFormData({ albumId: "", status: "PUBLISHED", files: [] });
    setUploadResults({ success: [], failed: [] });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">验证登录状态中...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">返回管理</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">上传照片</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    上传设置
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">选择相册</label>
                    <select
                      name="albumId"
                      value={formData.albumId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">不放入相册</option>
                      {albums.map(album => (
                        <option key={album.id} value={album.id}>{album.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">发布状态</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="DRAFT">待发布</option>
                      <option value="PUBLISHED">已发布</option>
                      <option value="ARCHIVED">下线</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || formData.files.length === 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  uploading || formData.files.length === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    上传中...
                  </span>
                ) : formData.files.length > 1 ? (
                  `上传 ${formData.files.length} 张照片`
                ) : (
                  "上传照片"
                )}
              </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="p-12 text-center">
                  <div className={`mx-auto h-16 w-16 mb-4 rounded-full flex items-center justify-center transition-colors ${
                    isDragOver ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDragOver ? 'text-blue-700' : 'text-gray-900'}`}>
                    {isDragOver ? '释放文件以上传' : '拖放照片到此处'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    或点击选择文件
                  </p>
                  <p className="text-xs text-gray-400">
                    支持 JPG、PNG、GIF 等图片格式，单文件最大 30MB
                  </p>
                </div>
              </div>

              {formData.files.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      已选择 {formData.files.length} 张照片
                    </h2>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        清空全部
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {formData.files.map((photoItem, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                          <div className="relative aspect-square">
                            <img
                              src={URL.createObjectURL(photoItem.file)}
                              alt={photoItem.title}
                              className="w-full h-full object-cover"
                            />
                            {!uploading && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 border border-gray-200 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                              <p className="text-white text-xs truncate">{photoItem.file.name}</p>
                              <p className="text-gray-300 text-xs">{(photoItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">标题</label>
                              <input
                                type="text"
                                value={photoItem.title}
                                onChange={(e) => handlePhotoTitleChange(index, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="输入标题"
                                disabled={uploading}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
                              <input
                                type="text"
                                value={photoItem.tags}
                                onChange={(e) => handlePhotoTagsChange(index, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="用逗号分隔，如：风景,自然"
                                disabled={uploading}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formData.files.length > 1 ? `批量上传进度：${currentFileIndex + 1} / ${formData.files.length}` : '上传中'}
                          </h3>
                           <p className="text-sm text-gray-500">
                             {formData.files[currentFileIndex]?.file.name || '...'}
                           </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{uploadProgress.toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { stage: 'uploading_original', label: '上传原图' },
                        { stage: 'generating_thumbnail', label: '生成缩略图' },
                        { stage: 'uploading_thumbnail', label: '上传缩略图' },
                        { stage: 'extracting_exif', label: '提取EXIF' },
                        { stage: 'saving_metadata', label: '保存元数据' }
                      ].map(({ stage, label }) => (
                        <span
                          key={stage}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            uploadStage === stage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {(uploadResults.success.length > 0 || uploadResults.failed.length > 0) && (
                      <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{uploadResults.success.length} 成功</span>
                        </div>
                        {uploadResults.failed.length > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{uploadResults.failed.length} 失败</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
