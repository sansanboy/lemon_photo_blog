import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExifData } from "@/lib/exif";
import { uploadToR2, generateThumbnail } from "@/lib/r2";

export async function GET() {
  try {
    requireAdmin();
    
    const photos = await prisma.photo.findMany({
      orderBy: [
        { takenAt: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        album: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    return Response.json(photos);
  } catch (error) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    // 创建照片记录
    const photo = await prisma.photo.create({
      data: {
        title: title || null,
        url: originalUrl,
        r2Key: originalKey,
        thumbnailUrl,
        exif: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
        takenAt: exifData?.takenAt || new Date(),
        albumId: albumId || null,
        order: 0 // 默认顺序，后续可调整
      }
    });
    
    // 处理标签
    if (tagsString) {
      const tags = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      for (const tagName of tags) {
        // 查找或创建标签
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });
        
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName }
          });
        }
        
        // 关联照片和标签
        await prisma.tagOnPhoto.create({
          data: {
            photoId: photo.id,
            tagId: tag.id
          }
        });
      }
    }
    
    return Response.json(photo);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}