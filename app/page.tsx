import { prisma } from "@/lib/db";
import { TagFilter } from "@/components/TagFilter";
import { PhotoGrid } from "@/components/PhotoGrid";

export default async function Home({ searchParams }: { searchParams: { tag?: string } }) {
  const tag = searchParams.tag;

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  const photos = await prisma.photo.findMany({
    where: tag
      ? {
          tags: {
            some: {
              tag: {
                name: tag
              }
            }
          }
        }
      : {},
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">全部照片</h1>
        <p className="text-gray-400 mt-2">浏览我的摄影作品</p>
      </div>
      
      <div className="mb-10">
        <TagFilter tags={tags} currentTag={tag} />
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <PhotoGrid photos={photos} />
      </div>
    </div>
  );
}