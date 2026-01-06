import Link from "next/link";

export const dynamic = "force-static";

type Album = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  cover: {
    id: string;
    url: string;
    filename: string;
    originalName: string;
    thumbnailUrl: string;
    takenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  photos: {
    id: string;
    url: string;
    filename: string;
    originalName: string;
    thumbnailUrl: string;
    takenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    order: number;
  }[];
};

async function getAlbums() {
  const res = await fetch(new URL('/api/albums', process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000').toString(), {
    next: { revalidate: 3600 } // 1 hour cache
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch albums');
  }
  
  return res.json();
}

export default async function AlbumsPage() {
  const { albums } = await getAlbums();

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">相册集</h1>
        <p className="text-gray-500 mt-2">探索我的摄影系列作品</p>
      </div>
      
      {albums.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-gray-500">暂无相册</p>
          <p className="text-sm text-gray-600 mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {albums.map((album: Album) => {
            const fallbackCover = album.photos[0] ?? null;
            const coverPhoto = album.cover ?? fallbackCover;

            return (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="photo-card group"
              >
                {coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPhoto.url}
                    alt={album.title}
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 text-lg">
                    暂无封面
                  </div>
                )}
                <figcaption>
                  <div className="font-medium group-hover:text-blue-600 transition-colors">
                    {album.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
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