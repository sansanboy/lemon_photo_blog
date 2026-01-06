import { prisma } from "@/lib/db";

export const runtime = 'nodejs';

type Props = {
  params: { slug: string };
};

export async function GET(request: Request, { params }: Props) {
  try {
    const album = await prisma.album.findUnique({
      where: { slug: params.slug },
      include: {
        photos: {
          orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }]
        }
      }
    });

    if (!album) {
      return Response.json({ error: "Album not found" }, { status: 404 });
    }

    // 格式化返回数据
    const formattedAlbum = {
      id: album.id,
      title: album.title,
      slug: album.slug,
      description: album.description,
      coverId: album.coverId,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      photos: album.photos.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        takenAt: photo.takenAt,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
        order: photo.order,
      }))
    };

    return Response.json({ album: formattedAlbum });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}