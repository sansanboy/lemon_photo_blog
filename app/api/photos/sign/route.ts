import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPresignedUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    requireAdmin();
    
    const { filename, contentType } = await request.json();
    
    if (!filename || !contentType) {
      return Response.json({ error: "Filename and contentType are required" }, { status: 400 });
    }
    
    const key = `photos/${Date.now()}_${filename}`;
    const url = await getPresignedUrl(key, 3600);
    
    return Response.json({ url, key });
  } catch (error) {
    console.error("Sign URL error:", error);
    return Response.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
