"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

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
    album?: {
        id: string;
        title: string;
    } | null;
    tags?: {
        tag: {
            id: string;
            name: string;
        };
    }[];
};

type PhotoGridProps = {
    photos: PhotoWithExif[];
};

type LightboxProps = {
    photos: PhotoWithExif[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (direction: "prev" | "next") => void;
};

function Lightbox({ photos, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
    const [mounted, setMounted] = useState(false);
    const currentPhoto = photos[currentIndex];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") onNavigate("prev");
            if (e.key === "ArrowRight") onNavigate("next");
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, onNavigate]);

    if (!isOpen || !currentPhoto || !mounted) return null;

    const exifData = currentPhoto.exif;

    const lightboxContent = (
        <div className="fixed inset-0 z-[9999] museum-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/90 hover:text-white museum-close-button"
                aria-label="Close fullscreen view"
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            <button
                onClick={() => onNavigate("prev")}
                className="absolute left-0 top-1/2
    -translate-y-1/2
    p-3
    text-white/80 hover:text-white
    rounded-full
    transition-all hover:scale-110
    museum-nav-button
    z-[10000] left-4 "
                aria-label="Previous photo"
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            <button
                onClick={() => onNavigate("next")}
                className="absolute right-0 top-1/2
    -translate-y-1/2
    p-3
    text-white/80 hover:text-white
    rounded-full
    transition-all hover:scale-110
    museum-nav-button
    z-[10000]  right-4 "
                aria-label="Next photo"
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            <div className="absolute top-6 left-6 text-white/70 text-sm font-medium tracking-wide museum-counter">
                {currentIndex + 1} / {photos.length}
            </div>

            <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative max-w-[85vw] px-4 md:px-8 pt-6 pb-1 flex-shrink-0">
                            <div className="museum-frame-shadow">
                                <div className="museum-frame">
                                    <div className="museum-mat">
                                        <img
                                            src={currentPhoto.url}
                                            alt={currentPhoto.title || "photograph"}
                                            className="max-w-full max-h-[75vh] object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="museum-plaque-container px-4 md:px-8 pt-0 pb-3 flex-shrink-0">
                            <div className="museum-plaque">
                                <div className="museum-plaque-brass-border"></div>
                                <div className="museum-plaque-content">
                                    {currentPhoto.title && (
                                        <h3 className="museum-plaque-title">
                                            {currentPhoto.title}
                                        </h3>
                                    )}
                                    {currentPhoto.takenAt && (
                                        <p className="museum-plaque-date">
                                            {new Date(currentPhoto.takenAt).toLocaleDateString("zh-CN", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    )}
                                    {exifData && (
                                        <div className="museum-plaque-exif-grid">
                                            {exifData.camera && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">Camera</span>
                                                    <span className="museum-plaque-exif-value">{exifData.camera}</span>
                                                </div>
                                            )}
                                            {exifData.lens && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">Lens</span>
                                                    <span className="museum-plaque-exif-value">{exifData.lens}</span>
                                                </div>
                                            )}
                                            {exifData.aperture && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">Aperture</span>
                                                    <span className="museum-plaque-exif-value">f/{exifData.aperture}</span>
                                                </div>
                                            )}
                                            {exifData.shutter && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">Shutter</span>
                                                    <span className="museum-plaque-exif-value">{exifData.shutter}s</span>
                                                </div>
                                            )}
                                            {exifData.iso && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">ISO</span>
                                                    <span className="museum-plaque-exif-value">{exifData.iso}</span>
                                                </div>
                                            )}
                                            {exifData.focalLength && (
                                                <div className="museum-plaque-exif-item">
                                                    <span className="museum-plaque-exif-label">Focal Length</span>
                                                    <span className="museum-plaque-exif-value">{exifData.focalLength}mm</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(lightboxContent, document.body);
}

export function PhotoGrid({ photos }: PhotoGridProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleOpenLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
    };

    const handleCloseLightbox = useCallback(() => {
        setLightboxOpen(false);
        document.body.style.overflow = "";
    }, []);

    const handleNavigate = (direction: "prev" | "next") => {
        if (direction === "prev") {
            setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
        } else {
            setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
        }
    };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 px-2 md:px-4">
                {photos.map((photo, index) => (
                    <div
                        key={photo.id}
                        className="group cursor-pointer"
                        onClick={() => handleOpenLightbox(index)}
                    >
                        <div className="wooden-frame">
                            <div className="inner-mat">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={photo.thumbnailUrl || photo.url}
                                        alt={photo.title || "photograph"}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        {photo.title && (
                                            <div className="text-white">
                                                <p className="font-semibold text-lg">{photo.title}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            {photo.title && (
                                <h3 className="text-gray-900 font-medium text-sm md:text-base group-hover:text-[#6B5344] transition-colors">
                                    {photo.title}
                                </h3>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Lightbox
                photos={photos}
                currentIndex={currentIndex}
                isOpen={lightboxOpen}
                onClose={handleCloseLightbox}
                onNavigate={handleNavigate}
            />
        </>
    );
}
