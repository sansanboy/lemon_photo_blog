import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/PhotoGrid";

type Props = {
  params: { slug: string };
};

export default async function AlbumDetailPage({ params }: Props) {
  const album = await prisma.album.findUnique({
    where: { slug: params.slug },
    include: {
      photos: {
        orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }]
      }
    }
  });

  if (!album) {
    notFound();
  }

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