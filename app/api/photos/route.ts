import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExifData } from "@/lib/exif";
import { uploadToR2, generateThumbnail, deleteFromR2 } from "@/lib/r2";

export const runtime = 'nodejs'; // 必须使用nodejs运行时，因为使用了sharp库

// 定义 API 响应类型
type PhotoResponse = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string | null;
  takenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  album: {
    id: string;
    title: string;
  } | null;
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
};

type TagResponse = {
  id: string;
  name: string;
};

type ApiResponse = {
  photos: PhotoResponse[];
  tags: TagResponse[];
};

export async function GET(request: NextRequest) {
  try {
    const tag = request.nextUrl.searchParams.get('tag');
    const statusParam = request.nextUrl.searchParams.get('status');
    
    // 获取所有标签
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

    // 根据标签和状态过滤照片
    const whereClause: any = {};
    if (tag) {
      whereClause.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }
    
    // 明确处理状态过滤：如果提供了status参数，验证并使用该值；否则默认只获取已发布的照片
    if (statusParam) {
      const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
      if (validStatuses.includes(statusParam)) {
        whereClause.status = statusParam as "DRAFT" | "PUBLISHED" | "ARCHIVED";
      } else {
        // 如果status参数无效，返回错误
        return Response.json({ error: "Invalid status value" }, { status: 400 });
      }
    } else {
      whereClause.status = 'PUBLISHED';
    }

    // 根据标签和状态过滤照片，使用 select 明确指定所有需要的字段
    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        r2Key: true,
        title: true,
        url: true,
        thumbnailUrl: true,
        takenAt: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        album: {
          select: {
            id: true,
            title: true,
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
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
      status: photo.status,
      album: photo.album ? {
        id: photo.album.id,
        title: photo.album.title,
      } : null,
      tags: photo.tags.map((photoTag) => ({
        tag: {
          id: photoTag.tag.id,
          name: photoTag.tag.name,
        },
      })),
    }));

    const response: ApiResponse = {
      photos: formattedPhotos,
      tags,
    };

    return Response.json(response);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin();

    const contentType = request.headers.get("content-type") || "";

    // ===============================
    // multipart/form-data 上传图片
    // ===============================
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const title = formData.get("title") as string;
      const albumId = formData.get("albumId") as string;
      const tagsString = formData.get("tags") as string;
      const statusParam = (formData.get("status") as string) || "PUBLISHED";

      if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

      const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
      if (!validStatuses.includes(statusParam))
        return Response.json({ error: "Invalid status value" }, { status: 400 });

      // ===============================
      // 1️⃣ 慢 IO: 上传文件 / 生成缩略图 / 解析 exif
      // ===============================
      const timestamp = Date.now();
      const originalKey = `photos/${timestamp}_${file.name}`;
      const thumbnailKey = `thumbnails/${timestamp}_${file.name}`;

      const originalUrl = await uploadToR2(originalKey, file);
      const thumbnailBuffer = await generateThumbnail(file);
      const thumbnailUrl = await uploadToR2(thumbnailKey, thumbnailBuffer, "image/jpeg");
      const arrayBuffer = await file.arrayBuffer();
      const exifData = await getExifData(Buffer.from(arrayBuffer));

      // ===============================
      // 2️⃣ 标签处理: upsert 幂等操作
      // ===============================
      const tagNames = tagsString
        ? tagsString.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      // 并发 upsert，每个 tag 独立，不依赖事务
      const tags = await Promise.all(
        tagNames.map((name) =>
          prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          })
        )
      );

      // ===============================
      // 3️⃣ 创建 photo，直接关联 tags
      // ===============================
      const photo = await prisma.photo.create({
        data: {
          title: title || null,
          url: originalUrl,
          r2Key: originalKey,
          thumbnailUrl,
          exif: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
          takenAt: exifData?.takenAt || new Date(),
          albumId: albumId || null,
          status: statusParam as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          order: 0,
          tags: {
            create: tags.map((tag) => ({
              tagId: tag.id,
            })),
          },
        },
      });

      return Response.json(photo);
    }

    const data = await request.json();
    const { url, key, title, albumId, tags, thumbnailUrl, exifData } = data;

    if (!url || !key || !thumbnailUrl) {
      return Response.json({ error: "URL, key and thumbnailUrl are required" }, { status: 400 });
    }

    const statusParam = data.status || "PUBLISHED";
    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    if (!validStatuses.includes(statusParam))
      return Response.json({ error: "Invalid status value" }, { status: 400 });

    const tagNames = tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

    const tagRecords = await Promise.all(
      tagNames.map((name: string) =>
        prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    const photo = await prisma.photo.create({
      data: {
        title: title || null,
        url,
        r2Key: key,
        thumbnailUrl,
        exif: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
        takenAt: exifData?.takenAt || new Date(),
        albumId: albumId || null,
        status: statusParam as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        order: 0,
        tags: {
          create: tagRecords.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
    });

    return Response.json(photo);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}


// 添加PUT方法来更新照片状态
export async function PUT(request: NextRequest) {
  try {
    requireAdmin();
    
    const data = await request.json();
    const { id, status: statusParam, title, albumId } = data;
    
    if (!id || !statusParam) {
      return Response.json({ error: "Photo ID and status are required" }, { status: 400 });
    }
    
    // 验证status值是否为有效值
    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    if (!validStatuses.includes(statusParam)) {
      return Response.json({ error: "Invalid status value" }, { status: 400 });
    }
    
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        status: statusParam as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        title: title || undefined,
        albumId: albumId || null,
      },
    });
    
    return Response.json(updatedPhoto);
  } catch (error) {
    console.error("Update error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

// 添加DELETE方法来删除照片
export async function DELETE(request: NextRequest) {
  try {
    requireAdmin();
    
    const photoId = request.nextUrl.pathname.split('/').pop();
    
    if (!photoId) {
      return Response.json({ error: "Photo ID is required" }, { status: 400 });
    }
    
    // 获取照片信息以删除R2中的文件
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });
    
    if (!photo) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }
    
    // 从R2删除文件
    await deleteFromR2(photo.r2Key);
    if (photo.thumbnailUrl) {
      const thumbnailKey = photo.thumbnailUrl.split('/').pop();
      if (thumbnailKey) {
        await deleteFromR2(`thumbnails/${thumbnailKey}`);
      }
    }
    
    // 从数据库删除照片
    await prisma.photo.delete({
      where: { id: photoId },
    });
    
    return Response.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}