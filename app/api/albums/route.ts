import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = 'nodejs'; // 使用nodejs运行时以保持一致性

export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cover: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            takenAt: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    // 格式化返回数据
    const formattedAlbums = albums.map(album => ({
      id: album.id,
      title: album.title,
      slug: album.slug,
      coverId: album.coverId,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      cover: album.cover ? {
        id: album.cover.id,
        url: album.cover.url,
        thumbnailUrl: album.cover.thumbnailUrl,
        takenAt: album.cover.takenAt,
        createdAt: album.cover.createdAt,
        updatedAt: album.cover.updatedAt,
      } : null,
      photos: album.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        takenAt: photo.takenAt,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
        order: photo.order,
      }))
    }));

    return Response.json({ albums: formattedAlbums });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // requireAdmin(); // 暂时移除，或根据实际需求保留
    
    const data = await request.json();
    const { title } = data;
    
    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    
    // 生成slug
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    
    const album = await prisma.album.create({
      data: {
        title,
        slug
      }
    });
    
    return Response.json(album);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to create album" }, { status: 500 });
  }
}