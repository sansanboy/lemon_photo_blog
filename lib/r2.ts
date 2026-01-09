import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 从环境变量获取R2配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME;

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET
) {
  console.warn(
    "R2 configuration is missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables."
  );
}

export const r2Client = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

// export const R2_BUCKET = R2_BUCKET as string;
export const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL as string;

// 上传文件到R2
export async function uploadToR2(
  key: string,
  file: any,
  contentType?: string
) {
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    throw new Error("R2 configuration is missing");
  }

  // 转换文件格式
  let buffer: Buffer;
  let detectedContentType = contentType;

  if (file instanceof Buffer) {
    buffer = file;
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else if (typeof file.arrayBuffer === 'function') {
    buffer = Buffer.from(await file.arrayBuffer());
    detectedContentType = detectedContentType || (file as any).type;
  } else if (file.buffer && file.buffer instanceof Buffer) {
    buffer = file.buffer;
    detectedContentType = detectedContentType || file.mimetype;
  } else {
    throw new Error("Unsupported file type for upload");
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: detectedContentType || "application/octet-stream",
  });

  await r2Client.send(command);

  // 返回公开URL
  return `${R2_PUBLIC_BASE_URL}/${key}`;
}

// 生成缩略图
export async function generateThumbnail(
  file: any
): Promise<Buffer> {
  let buffer: Buffer;

  if (file instanceof Buffer) {
    buffer = file;
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else if (typeof file.arrayBuffer === 'function') {
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (file.buffer && file.buffer instanceof Buffer) {
    buffer = file.buffer;
  } else {
    throw new Error("Unsupported file type for thumbnail generation");
  }

  // 动态导入sharp库，以解决Vercel部署时的兼容性问题
  const sharp = (await import('sharp')).default;
  
  // 使用sharp生成缩略图
  return await sharp(buffer)
    .resize(300, 300, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// 删除R2中的文件
export async function deleteFromR2(key: string) {
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    throw new Error("R2 configuration is missing");
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await r2Client.send(command);
}

// 生成预签名URL（如果需要）
export async function getPresignedUrl(key: string, expiresIn: number = 3600) {
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    throw new Error("R2 configuration is missing");
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: detectedContentType || 'application/octet-stream',
    CacheControl: 'public, max-age=31536000, immutable',
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}