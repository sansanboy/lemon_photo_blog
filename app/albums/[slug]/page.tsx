import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getAlbumBySlug } from "@/lib/photos";

export const revalidate = 3600;

type Props = {
  params: { slug: string };
};

export default async function AlbumDetailPage({ params }: Props) {
  let data;

  try {
    data = await getAlbumBySlug(params.slug);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-16 md:mb-20 text-center">
        <h1 className="page-title text-gradient">{data.title}</h1>
        <p className="page-subtitle">
          {data.photos.length} 张照片 · 创建于 {new Date(data.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <div className="flex flex-col">
        <PhotoGrid photos={data.photos} />
      </div>
    </div>
  );
}
