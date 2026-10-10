import { forwardRef, type VideoHTMLAttributes } from "react";
import { cn } from "../lib/utils.ts";

// Video file extensions regex for auto-detection
const VIDEO_FILE_REGEX = /\.(mp4|webm|ogg|mov|avi)$/i;

// Helper function to auto-detect video MIME type
function detectVideoType(src: string): string {
  const extension = src.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    default:
      return "video/mp4";
  }
}

interface VideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  /** When true, displays as thumbnail with autoplay, muted, loop, no controls */
  asThumbnail?: boolean;
  className?: string;
  fallbackText?: string;
  sources: Array<{
    src: string;
    type?: string; // Make type optional, will auto-detect if not provided
  }>;
}

const Video = forwardRef<HTMLVideoElement, VideoProps>(
  (
    {
      className,
      sources,
      fallbackText = "Your browser does not support the video tag.",
      asThumbnail = false,
      ...props
    },
    ref,
  ) => {
    // Auto-detect if we should use thumbnail mode based on video file extensions
    const isVideoFile = sources.length === 1 && VIDEO_FILE_REGEX.test(sources.at(0)?.src ?? "");
    const useThumbnailMode = asThumbnail || isVideoFile;

    const thumbnailProps = useThumbnailMode
      ? {
          autoPlay: true,
          muted: true,
          loop: true,
          controls: false,
          playsInline: true, // Prevents fullscreen on mobile
        }
      : {};

    return (
      <video className={cn("h-auto w-full", className)} ref={ref} {...thumbnailProps} {...props}>
        {sources.map((source, index) => (
          <source
            key={`${source.src}-${index}`}
            src={source.src}
            type={source.type || detectVideoType(source.src)}
          />
        ))}
        <p className="p-4 text-center text-muted-foreground">{fallbackText}</p>
      </video>
    );
  },
);

Video.displayName = "Video";

export { Video, type VideoProps };
