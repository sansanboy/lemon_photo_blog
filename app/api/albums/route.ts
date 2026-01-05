import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    requireAdmin();
    
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cover: true,
        photos: {
          orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
          take: 1
        }
      }
    });
    
    return Response.json(albums);
  } catch (error) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin();
    
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
    return Response.json({ error: "Failed to create album" }, { status: 500 });
  }
}