import { TagFilter } from "@/components/TagFilter";
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

// 定义类型以匹配原有数据结构
type Tag = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type Photo = {
  id: string;
  filename: string;
  title: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  takenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  album: {
    id: string;
    title: string;
  } | null;
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
};

type ApiResponse = {
  photos: Photo[];
  tags: Tag[];
};

async function getPhotos({ tag }: { tag?: string } = {}): Promise<ApiResponse> {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  params.append('status', 'PUBLISHED');

  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/photos?${params.toString()}`, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    console.error('Failed to fetch photos:', res.status, res.statusText);
    throw new Error(`Failed to fetch photos: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams.tag;
  let data;
  
  try {
    data = await getPhotos({ tag });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">无法加载照片</h2>
          <p className="text-gray-600">请稍后重试</p>
        </div>
      </div>
    );
  }
  
  const { photos, tags } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <TagFilter tags={tags} currentTag={tag} />
      </div>

      <div className="flex flex-col">
        <PhotoGrid photos={photos} />
      </div>
    </div>
  );
}