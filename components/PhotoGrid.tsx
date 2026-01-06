type Tag = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type PhotoWithExif = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string | null;
  takenAt?: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  album: {
    id: string;
    title: string;
  } | null;
  tags: {
    tag: Tag;
  }[];
  exif?: any;
};

type PhotoGridProps = {
  photos: PhotoWithExif[];
};

// Helper function to safely extract EXIF data
function getExifData(exif: any): {
  camera?: string | null;
  lens?: string | null;
  iso?: number | null;
  shutter?: number | string | null;
  aperture?: number | null;
  focalLength?: number | null;
} | null {
  if (!exif || typeof exif !== 'object') {
    return null;
  }
  return exif as {
    camera?: string | null;
    lens?: string | null;
    iso?: number | null;
    shutter?: number | string | null;
    aperture?: number | null;
    focalLength?: number | null;
  } | null;
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  if (!photos.length) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-gray-500">暂无照片</p>
        <p className="text-sm text-gray-400 mt-2">请尝试其他筛选条件</p>
      </div>
    );
  }

  return (
    <>
      {photos.map((photo, index) => {
        const isEven = index % 2 === 0;
        const exifData = getExifData(photo.exif);
        return (
          <article
            key={photo.id}
            className={`photo-row group ${isEven ? "flex-row" : "flex-row-reverse"}`}
          >
            <div className="photo-image-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.originalName || "photograph"}
                className="photo-image"
              />
            </div>

            <div className="photo-info-wrapper">
              <div className="photo-info-content">
                <h2 className="photo-title">
                  {photo.originalName || ""}
                </h2>

                {photo.album && (
                  <p className="photo-album">
                    相册: {photo.album.title}
                  </p>
                )}

                {photo.takenAt && (
                  <p className="photo-date">
                    {new Date(
                      photo.takenAt,
                    ).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}

                {photo.tags && photo.tags.length > 0 && (
                  <div className="photo-tags">
                    {photo.tags.map((photoTag, idx) => (
                      <span key={idx} className="tag-badge">
                        {photoTag.tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {(exifData?.camera || exifData?.lens) && (
                  <div className="photo-equipment">
                    {exifData?.camera && (
                      <div className="exif-item">
                        <span className="exif-label">
                          相机
                        </span>
                        <span className="exif-value">
                          {exifData.camera}
                        </span>
                      </div>
                    )}
                    {exifData?.lens && (
                      <div className="exif-item">
                        <span className="exif-label">
                          镜头
                        </span>
                        <span className="exif-value">
                          {exifData.lens}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(exifData?.iso ||
                  exifData?.aperture ||
                  exifData?.shutter ||
                  exifData?.focalLength) && (
                  <div className="photo-exif">
                    {exifData?.iso && (
                      <span className="exif-tag">
                        ISO {exifData.iso}
                      </span>
                    )}
                    {exifData?.aperture && (
                      <span className="exif-tag">
                        f/{exifData.aperture}
                      </span>
                    )}
                    {exifData?.shutter && (
                      <span className="exif-tag">
                        {exifData.shutter}s
                      </span>
                    )}
                    {exifData?.focalLength && (
                      <span className="exif-tag">
                        {exifData.focalLength}mm
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}