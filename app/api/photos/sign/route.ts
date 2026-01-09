import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPresignedUrl } from "@/lib/r2";
import { R2_PUBLIC_BASE_URL } from "@/lib/r2";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    requireAdmin();

    const { filename, contentType, fileSize } = await request.json();

    if (!filename || !contentType || !fileSize) {
      return Response.json({ error: "Filename, contentType and fileSize are required" }, { status: 400 });
    }

    if (!contentType.startsWith('image/')) {
      return Response.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const MAX_SIZE = 30 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      return Response.json({ error: "File size exceeds 30MB limit" }, { status: 400 });
    }

    const timestamp = Date.now();

    const originalKey = `photos/${timestamp}_${filename}`;
    const originalPresignedUrl = await getPresignedUrl(originalKey, 3600);

    const thumbnailKey = `thumbnails/${timestamp}_${filename}`;
    const thumbnailPresignedUrl = await getPresignedUrl(thumbnailKey, 3600);

    return Response.json({
      originalPresignedUrl,
      originalKey,
      thumbnailPresignedUrl,
      thumbnailKey,
      originalUrl: `${R2_PUBLIC_BASE_URL}/${originalKey}`,
      thumbnailUrl: `${R2_PUBLIC_BASE_URL}/${thumbnailKey}`,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Sign URL error:", error);
    return Response.json({ error: "Failed to generate signed URLs" }, { status: 500 });
  }
}