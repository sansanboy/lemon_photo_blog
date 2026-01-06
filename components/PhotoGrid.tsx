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
                return (
                    <article
                        key={photo.id}
                        className={`photo-row group ${isEven ? "flex-row" : "flex-row-reverse"}`}
                    >
                        <div className="photo-image-wrapper">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photo.url}
                                alt={photo.title || "photograph"}
                                className="photo-image"
                            />
                        </div>

                        <div className="photo-info-wrapper">
                            <div className="photo-info-content">
                                <h2 className="photo-title">
                                    {photo.title || ""}
                                </h2>

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

                                {(photo.exif?.camera || photo.exif?.lens) && (
                                    <div className="photo-equipment">
                                        {photo.exif?.camera && (
                                            <div className="exif-item">
                                                <span className="exif-label">
                                                    相机
                                                </span>
                                                <span className="exif-value">
                                                    {photo.exif.camera}
                                                </span>
                                            </div>
                                        )}
                                        {photo.exif?.lens && (
                                            <div className="exif-item">
                                                <span className="exif-label">
                                                    镜头
                                                </span>
                                                <span className="exif-value">
                                                    {photo.exif.lens}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(photo.exif?.iso ||
                                    photo.exif?.aperture ||
                                    photo.exif?.shutter ||
                                    photo.exif?.focalLength) && (
                                    <div className="photo-exif">
                                        {photo.exif?.iso && (
                                            <span className="exif-tag">
                                                ISO {photo.exif.iso}
                                            </span>
                                        )}
                                        {photo.exif?.aperture && (
                                            <span className="exif-tag">
                                                f/{photo.exif.aperture}
                                            </span>
                                        )}
                                        {photo.exif?.shutter && (
                                            <span className="exif-tag">
                                                {photo.exif.shutter}s
                                            </span>
                                        )}
                                        {photo.exif?.focalLength && (
                                            <span className="exif-tag">
                                                {photo.exif.focalLength}mm
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
