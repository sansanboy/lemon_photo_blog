import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/PhotoGrid";

type Props = {
  params: { slug: string };
};

type Album = {
  id: string;
  title: string;
  slug: string;
  coverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: {
    id: string;
    title: string | null;
    url: string;
    thumbnailUrl: string | null;
    takenAt: Date | null;
    exif: any;
  }[];
};

async function getAlbum(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/albums/${slug}`, {
    next: { revalidate: 3600 } // 1 hour cache
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch album');
  }
  
  return res.json();
}

export default async function AlbumDetailPage({ params }: Props) {
  const data = await getAlbum(params.slug);
  
  if (!data) {
    notFound();
  }
  
  const album: Album = data.album;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-16 md:mb-20 text-center">
        <h1 className="page-title text-gradient">{album.title}</h1>
        <p className="page-subtitle">
          {album.photos.length} 张照片 · 创建于 {new Date(album.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <div className="flex flex-col">
        <PhotoGrid photos={album.photos} />
      </div>
    </div>
  );
}