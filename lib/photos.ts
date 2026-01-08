import { prisma } from "./db";

export type Photo = {
  id: string;
  filename: string;
  title: string;
  originalName: string;
  url: string;
  thumbnailUrl: string | null;
  takenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
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

export type Tag = {
  id: string;
  name: string;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  coverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  cover: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    takenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  photos: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    takenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    order: number;
  }[];
};

export type AlbumWithPhotos = {
  id: string;
  title: string;
  slug: string;
  coverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: {
    id: string;
    title: string | null;
    url: string;
    thumbnailUrl: string | null;
    takenAt: Date | null;
    exif: any;
  }[];
};

export async function getPhotos(tag?: string) {
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

  whereClause.status = 'PUBLISHED';

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

  return photos.map((photo) => ({
    id: photo.id,
    filename: photo.r2Key.split("/").pop() || "",
    title: photo.title || "",
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
}

export async function getTags() {
  return await prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getAlbums() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      coverId: true,
      createdAt: true,
      updatedAt: true,
      cover: {
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          takenAt: true,
          createdAt: true,
          updatedAt: true,
        }
      },
      photos: {
        orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          takenAt: true,
          createdAt: true,
          updatedAt: true,
          order: true,
        }
      }
    }
  });

  return albums.map(album => ({
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
}

export async function getAlbumBySlug(slug: string) {
  const album = await prisma.album.findUnique({
    where: { slug },
    include: {
      photos: {
        orderBy: [{ order: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }]
      }
    }
  });

  if (!album) {
    return null;
  }

  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    coverId: album.coverId,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    photos: album.photos.map(photo => ({
      id: photo.id,
      title: photo.title,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl || undefined,
      takenAt: photo.takenAt,
      exif: typeof photo.exif === 'object' && photo.exif !== null ? photo.exif as any : undefined,
    }))
  };
}
