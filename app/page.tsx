import { TagFilter } from "@/components/TagFilter";
import { PhotoGrid } from "@/components/PhotoGrid";

export const dynamic = 'force-static';

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
    tag: Tag;
  }[];
};

async function getPhotos({ tag }: { tag?: string } = {}) {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  params.append('status', 'PUBLISHED'); // 只获取已发布的照片
  const queryString = params.toString();
  
  const res = await fetch(new URL(`/api/photos?${queryString}`, process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000').toString(), {
    next: { revalidate: 3600 } // 1 hour cache
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch photos');
  }
  
  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams.tag;
  const { photos, tags } = await getPhotos({ tag });

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