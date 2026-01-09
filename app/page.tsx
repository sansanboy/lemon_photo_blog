import { TagFilter } from "@/components/TagFilter";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getPhotos, getTags, type Photo, type Tag } from "@/lib/photos";

export const revalidate = 1800;

export default async function Home({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams.tag;
  let photos: Photo[];
  let tags: Tag[];

  try {
    [photos, tags] = await Promise.all([
      getPhotos(tag),
      getTags()
    ]);
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
