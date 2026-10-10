import type { DataSource } from "photoswipe";
import PhotoSwipe from "photoswipe";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils.ts";

// PhotoSwipe styles need to be imported
import "photoswipe/style.css";

export interface PhotoSwipeImage {
  alt?: string;
  caption?: string;
  height: number;
  src: string;
  width: number;
}

export interface PhotoSwipeGalleryProps {
  children: React.ReactNode;
  className?: string;
  galleryId?: string;
  images: PhotoSwipeImage[];
  options?: Partial<PhotoSwipe["options"]>;
}

// Custom hook for PhotoSwipe functionality
export function usePhotoSwipe(
  images: PhotoSwipeImage[],
  options: Partial<PhotoSwipe["options"]> = {},
) {
  const [photoSwipe, setPhotoSwipe] = useState<PhotoSwipe | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const openPhotoSwipe = useCallback(
    (index = 0) => {
      if (!images.length) {
        return;
      }

      const dataSource: DataSource = images.map((image) => ({
        src: image.src,
        width: image.width,
        height: image.height,
        alt: image.alt || "",
        caption: image.caption,
      }));

      // Responsive padding based on viewport width
      const isMobile = window.innerWidth < 768;
      const responsivePadding = isMobile
        ? { top: 20, bottom: 40, left: 10, right: 10 }
        : { top: 20, bottom: 40, left: 100, right: 100 };

      const defaultOptions = {
        dataSource,
        index,
        showHideAnimationType: "zoom" as const,
        bgOpacity: 0.9,
        closeOnVerticalDrag: true,
        pinchToClose: true,
        allowPanToNext: true,
        wheelToZoom: true,
        zoom: true,
        // Custom styling to match the project's theme with responsive padding
        padding: responsivePadding,
        ...options,
      };

      const pswp = new PhotoSwipe(defaultOptions);
      setPhotoSwipe(pswp);

      // Add custom close handler
      pswp.on("destroy", () => {
        setPhotoSwipe(null);
      });

      // Handle responsive padding on resize/orientation change
      const handleResize = () => {
        const newIsMobile = window.innerWidth < 768;
        const newPadding = newIsMobile
          ? { top: 20, bottom: 40, left: 10, right: 10 }
          : { top: 20, bottom: 40, left: 100, right: 100 };

        if (pswp.options) {
          pswp.options.padding = newPadding;
        }
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      pswp.on("destroy", () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      });

      pswp.init();
    },
    [images, options],
  );

  const closePhotoSwipe = useCallback(() => {
    if (photoSwipe) {
      photoSwipe.close();
    }
  }, [photoSwipe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (photoSwipe) {
        photoSwipe.destroy();
      }
    };
  }, [photoSwipe]);

  return {
    openPhotoSwipe,
    closePhotoSwipe,
    photoSwipe,
    galleryRef,
  };
}

// Helper function to collect all images from galleries with the same ID
function collectGlobalGalleryImages(galleryId: string, clickedElement: HTMLElement) {
  const allGalleries = document.querySelectorAll(`[data-gallery-id="${galleryId}"]`);
  const allImages: PhotoSwipeImage[] = [];
  let clickedImageGlobalIndex = 0;
  let currentGlobalIndex = 0;

  for (const gallery of allGalleries) {
    const galleryImages = gallery.querySelectorAll("[data-pswp-index]");
    for (const img of galleryImages) {
      const imgElement = img as HTMLElement;
      if (imgElement === clickedElement) {
        clickedImageGlobalIndex = currentGlobalIndex;
      }

      allImages.push({
        src: imgElement.getAttribute("data-pswp-src") || "",
        width: Number.parseInt(imgElement.getAttribute("data-pswp-width") || "1200", 10),
        height: Number.parseInt(imgElement.getAttribute("data-pswp-height") || "800", 10),
        alt: imgElement.getAttribute("aria-label") || "",
      });
      currentGlobalIndex++;
    }
  }

  return { allImages, clickedImageGlobalIndex };
}

// PhotoSwipe Gallery Component
export function PhotoSwipeGallery({
  images,
  children,
  className,
  galleryId = "photoswipe-gallery",
  options = {},
}: PhotoSwipeGalleryProps) {
  const { openPhotoSwipe } = usePhotoSwipe(images, options);

  // Handle click events on gallery children
  const handleGalleryClick = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      const imageElement = target.closest("[data-pswp-index]");

      if (imageElement) {
        event.preventDefault();

        // For shared gallery IDs, collect all images from all gallery sections on the page
        const { allImages, clickedImageGlobalIndex } = collectGlobalGalleryImages(
          galleryId,
          imageElement as HTMLElement,
        );

        // Use the collected images and the global index
        if (allImages.length > images.length) {
          // Multiple galleries detected, use global collection
          const globalOpenPhotoSwipe = (index = 0) => {
            const dataSource = allImages.map((image) => ({
              src: image.src,
              width: image.width,
              height: image.height,
              alt: image.alt || "",
              caption: image.caption,
            }));

            const isMobile = window.innerWidth < 768;
            const responsivePadding = isMobile
              ? { top: 20, bottom: 40, left: 10, right: 10 }
              : { top: 20, bottom: 40, left: 100, right: 100 };

            const pswp = new PhotoSwipe({
              dataSource,
              index,
              showHideAnimationType: "zoom" as const,
              bgOpacity: 0.9,
              closeOnVerticalDrag: true,
              pinchToClose: true,
              allowPanToNext: true,
              wheelToZoom: true,
              zoom: true,
              padding: responsivePadding,
              ...options,
            });

            pswp.init();
          };

          globalOpenPhotoSwipe(clickedImageGlobalIndex);
        } else {
          // Single gallery, use normal behavior
          const index = Number.parseInt(imageElement.getAttribute("data-pswp-index") || "0", 10);
          openPhotoSwipe(index);
        }
      }
    },
    [openPhotoSwipe, images.length, galleryId, options],
  );

  const galleryRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        node.addEventListener("click", handleGalleryClick);
        return () => {
          node.removeEventListener("click", handleGalleryClick);
        };
      }
    },
    [handleGalleryClick],
  );

  return (
    <section
      aria-label="Image gallery"
      className={cn("photoswipe-gallery", className)}
      data-gallery-id={galleryId}
      ref={galleryRef}
    >
      {children}
    </section>
  );
}

// PhotoSwipe Image Component for grid items
export interface PhotoSwipeImageProps {
  alt: string;
  children?: React.ReactNode;
  className?: string;
  height?: number;
  index: number;
  src: string;
  width?: number;
}

export function PhotoSwipeImage({
  src,
  alt,
  index,
  width = 1200,
  height = 800,
  className,
  children,
}: PhotoSwipeImageProps) {
  return (
    <button
      aria-label={`View ${alt} in gallery`}
      className={cn(
        "group block w-full cursor-zoom-in overflow-hidden border-none bg-transparent p-0",
        className,
      )}
      data-pswp-height={height}
      data-pswp-index={index}
      data-pswp-src={src}
      data-pswp-width={width}
      type="button"
    >
      <div>{children}</div>
    </button>
  );
}

// Utility function to estimate image dimensions for PhotoSwipe fallback
export function getImageDimensions(
  aspectRatio?: string,
  defaultWidth = 1200,
): { width: number; height: number } {
  const ratioMap = {
    "1/1": { width: defaultWidth, height: defaultWidth },
    "4/3": { width: defaultWidth, height: Math.round(defaultWidth * 0.75) },
    "3/4": { width: defaultWidth, height: Math.round(defaultWidth * 1.33) },
    "16/9": { width: defaultWidth, height: Math.round(defaultWidth * 0.5625) },
    "9/16": { width: defaultWidth, height: Math.round(defaultWidth * 1.78) },
    "2/3": { width: defaultWidth, height: Math.round(defaultWidth * 1.5) },
    "3/2": { width: defaultWidth, height: Math.round(defaultWidth * 0.67) },
  };

  return ratioMap[aspectRatio as keyof typeof ratioMap] || ratioMap["16/9"];
}

// Utility function to get actual image dimensions from an image URL
export function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = src;
  });
}

// Enhanced utility function that tries to get real dimensions, falls back to estimated
export async function getRealImageDimensions(
  src: string,
  aspectRatio?: string,
): Promise<{ width: number; height: number }> {
  try {
    return await loadImageDimensions(src);
  } catch {
    // Failed to load image dimensions, using fallback
    return getImageDimensions(aspectRatio);
  }
}
