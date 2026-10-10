import { Skeleton } from "@ddu/ui/skeleton";
import { cn } from "@ddu/ui/lib/utils";
import { useImage } from "./history-data.ts";

export function Thumbnail({ path, className }: { path: string; className?: string }) {
  const image = useImage(path);
  if (image.error)
    return <div className={cn("text-xs text-destructive", className)}>无法加载图片</div>;
  if (!image.data) return <Skeleton className={cn("aspect-video w-full", className)} />;
  return (
    <img
      src={image.data}
      alt={path.split("/").pop() ?? path}
      className={cn("rounded-md object-contain", className)}
    />
  );
}
