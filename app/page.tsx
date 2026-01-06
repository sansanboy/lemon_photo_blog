import { prisma } from "@/lib/db";
import { TagFilter } from "@/components/TagFilter";
import { PhotoGrid } from "@/components/PhotoGrid";

export default async function Home({
    searchParams,
}: {
    searchParams: { tag?: string };
}) {
    const tag = searchParams.tag;

    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

    const photos = await prisma.photo.findMany({
        where: tag
            ? {
                  tags: {
                      some: {
                          tag: {
                              name: tag,
                          },
                      },
                  },
              }
            : {},
        orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    });

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
