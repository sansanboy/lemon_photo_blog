type PhotoWithExif = {
  id: string;
  title: string | null;
  url: string;
  thumbnailUrl?: string | null;
  takenAt?: Date | string | null;
  exif?: {
    camera?: string | null;
    lens?: string | null;
    iso?: number | null;
    shutter?: number | string | null;
    aperture?: number | null;
    focalLength?: number | null;
  } | null;
};

type PhotoGridProps = {
  photos: PhotoWithExif[];
};

export function PhotoGrid({ photos }: PhotoGridProps) {
  if (!photos.length) {
    return (
      <div className="text-center py-12 col-span-full">
        <p className="text-lg text-gray-500">暂无照片</p>
        <p className="text-sm text-gray-600 mt-2">请尝试其他筛选条件</p>
      </div>
    );
  }

  return (
    <>
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="photo-card group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.title || "photo"}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          <figcaption className="photo-card">
            <div className="font-medium group-hover:text-blue-400 transition-colors">
              {photo.title || "未命名照片"}
            </div>
            {(photo.takenAt || photo.exif) && (
              <div className="exif-info">
                {photo.takenAt && (
                  <div className="text-gray-400">拍摄时间：{new Date(photo.takenAt).toLocaleString('zh-CN')}</div>
                )}
                {photo.exif?.camera && <div>相机：{photo.exif.camera}</div>}
                {photo.exif?.lens && <div>镜头：{photo.exif.lens}</div>}
                {(photo.exif?.iso || photo.exif?.aperture || photo.exif?.shutter) && (
                  <div className="flex flex-wrap gap-x-2">
                    {photo.exif.iso && <span>ISO {photo.exif.iso}</span>}
                    {photo.exif.aperture && <span>f/{photo.exif.aperture}</span>}
                    {photo.exif.shutter && <span>{photo.exif.shutter}s</span>}
                  </div>
                )}
                {photo.exif?.focalLength && <div>焦距：{photo.exif.focalLength}mm</div>}
              </div>
            )}
          </figcaption>
        </figure>
      ))}
    </>
  );
}