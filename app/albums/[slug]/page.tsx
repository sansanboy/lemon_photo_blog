import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/PhotoGrid";
import { headers } from "next/headers";

export const revalidate = 3600;

function getBaseUrl() {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

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
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/albums/${slug}`, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    console.error('Failed to fetch album:', res.status, res.statusText);
    throw new Error(`Failed to fetch album: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function AlbumDetailPage({ params }: Props) {
  let data;
  
  try {
    data = await getAlbum(params.slug);
  } catch (error) {
    console.error('Error fetching album:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">无法加载相册</h2>
          <p className="text-gray-600">请稍后重试</p>
        </div>
      </div>
    );
  }
  
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