import Link from "next/link";
import { getAlbums } from "@/lib/photos";

export const revalidate = 3600;

export default async function AlbumsPage() {
  const albums = await getAlbums();

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#6B5344] to-[#A69270] bg-clip-text text-transparent">相册集</h1>
        <p className="text-[#A69270] mt-2">探索我的摄影系列作品</p>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-[#4A3828]">暂无相册</p>
          <p className="text-sm text-[#A69270] mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {albums.map((album) => {
            const fallbackCover = album.photos[0] ?? null;
            const coverPhoto = album.cover ?? fallbackCover;

            return (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="photo-card group"
              >
                {coverPhoto ? (
                  <img
                    src={coverPhoto.url}
                    alt={album.title}
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#E8E0D5] text-[#B8A888] text-lg">
                    暂无封面
                  </div>
                )}
                <figcaption>
                  <div className="font-medium group-hover:text-[#6B5344] transition-colors text-[#4A3828]">
                    {album.title}
                  </div>
                  <div className="text-xs text-[#A69270] mt-1">
                    {album.photos.length} 张照片 · 创建于 {new Date(album.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </figcaption>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
