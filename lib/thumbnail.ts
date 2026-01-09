import sharp from 'sharp';

export interface ThumbnailConfig {
  name: string;
  width: number;
  height: number;
  quality: number;
}

export const THUMBNAIL_CONFIGS: ThumbnailConfig[] = [
  { name: 'small', width: 320, height: 320, quality: 75 },
  { name: 'medium', width: 640, height: 640, quality: 80 },
  { name: 'large', width: 1024, height: 1024, quality: 85 },
];

export interface GeneratedThumbnails {
  small: Buffer;
  medium: Buffer;
  large: Buffer;
}

export async function generateThumbnails(file: File | Buffer): Promise<GeneratedThumbnails> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const { width, height } = metadata;
  if (!width || !height) {
    throw new Error('Unable to get image dimensions');
  }

  const aspectRatio = width / height;

  const results: GeneratedThumbnails = {} as GeneratedThumbnails;

  for (const config of THUMBNAIL_CONFIGS) {
    let targetWidth = config.width;
    let targetHeight = Math.round(targetWidth / aspectRatio);

    if (targetHeight > config.height) {
      targetHeight = config.height;
      targetWidth = Math.round(targetHeight * aspectRatio);
    }

    results[config.name as keyof GeneratedThumbnails] = await image
      .resize(targetWidth, targetHeight, { fit: 'inside' })
      .jpeg({ quality: config.quality })
      .toBuffer();
  }

  return results;
}

export async function generateThumbnail(
  file: File | Buffer,
  size = 300
): Promise<Buffer> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let { width, height } = metadata;
  if (!width || !height) {
    throw new Error('Unable to get image dimensions');
  }

  const aspectRatio = width / height;

  if (width > height) {
    if (width > size) {
      height = Math.round(size / aspectRatio);
      width = size;
    }
  } else {
    if (height > size) {
      width = Math.round(size * aspectRatio);
      height = size;
    }
  }

  return await image
    .resize(width, height)
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function generateWebPThumbnail(
  file: File | Buffer,
  size = 640
): Promise<Buffer> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let { width, height } = metadata;
  if (!width || !height) {
    throw new Error('Unable to get image dimensions');
  }

  const aspectRatio = width / height;

  if (width > height) {
    if (width > size) {
      height = Math.round(size / aspectRatio);
      width = size;
    }
  } else {
    if (height > size) {
      width = Math.round(size * aspectRatio);
      height = size;
    }
  }

  return await image
    .resize(width, height, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function generateBlurPlaceholder(
  file: File | Buffer,
  width = 8,
  height = 8,
  quality = 10
): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const image = sharp(buffer);
  const dataUrl = await image
    .resize(width, height, { fit: 'cover' })
    .blur(2)
    .jpeg({ quality })
    .toBuffer();

  return `data:image/jpeg;base64,${dataUrl.toString('base64')}`;
}
