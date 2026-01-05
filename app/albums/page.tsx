import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cover: true,
      photos: {
        orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
        take: 1
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">相册集</h1>
        <p className="text-gray-400 mt-2">探索我的摄影系列作品</p>
      </div>
      
      {albums.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-gray-500">暂无相册</p>
          <p className="text-sm text-gray-600 mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const fallbackCover = album.photos[0] ?? null;
            const coverPhoto = album.cover ?? fallbackCover;

            return (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPhoto.thumbnailUrl || coverPhoto.url}
                    alt={album.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-500 text-lg">
                    暂无封面
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-gray-200 group-hover:text-blue-400 transition-colors">
                    {album.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {album.photos.length} 张照片
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    创建于 {new Date(album.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}