import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExifData } from "@/lib/exif";
import { uploadToR2, generateThumbnail } from "@/lib/r2";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 获取所有标签
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

    // 根据标签过滤照片
    const photos = await prisma.photo.findMany({
      where: {
        tags: {
          some: {
            tag: {
              name: request.nextUrl.searchParams.get('tag') || undefined,
            },
          },
        },
      },
      orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 格式化返回数据
    const formattedPhotos = photos.map((photo) => ({
      id: photo.id,
      filename: photo.r2Key.split("/").pop() || "",
      originalName: photo.title || "",
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      takenAt: photo.takenAt,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
      tags: photo.tags.map((photoTag) => ({
        tag: {
          id: photoTag.tag.id,
          name: photoTag.tag.name,
          createdAt: photoTag.tag.createdAt,
          updatedAt: photoTag.tag.updatedAt,
        },
      })),
    }));

    return Response.json({
      photos: formattedPhotos,
      tags,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const albumId = formData.get("albumId") as string;
    const tagsString = formData.get("tags") as string;
    
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    
    // 上传原图到R2
    const originalKey = `photos/${Date.now()}_${file.name}`;
    const originalUrl = await uploadToR2(originalKey, file);
    
    // 生成缩略图
    const thumbnailKey = `thumbnails/${Date.now()}_${file.name}`;
    const thumbnailBuffer = await generateThumbnail(file);
    const thumbnailUrl = await uploadToR2(thumbnailKey, thumbnailBuffer, "image/jpeg");
    
    // 获取EXIF信息
    const arrayBuffer = await file.arrayBuffer();
    const exifData = await getExifData(Buffer.from(arrayBuffer));

    // 使用事务来确保数据一致性
    const photo = await prisma.$transaction(async (prisma) => {
      // 创建或获取标签，并关联到照片
      const connectOrCreateTags = tagsString
        ? tagsString
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
            .map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            }))
        : [];

      // 创建照片记录及其标签关联
      return await prisma.photo.create({
        data: {
          title: title || null,
          url: originalUrl,
          r2Key: originalKey,
          thumbnailUrl,
          exif: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
          takenAt: exifData?.takenAt || new Date(),
          albumId: albumId || null,
          order: 0,
          tags: {
            create: connectOrCreateTags,
          },
        },
      });
    });
    
    return Response.json(photo);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}