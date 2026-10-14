import type { HistoryItem } from "@ddu/native";
import { formatFileSize, formatTime } from "@ddu/utils";

/** Compact screenshot metadata, shared by grid cards and list rows. */
export function FileInfo({ item }: { item: HistoryItem }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span>{formatFileSize(item.file_size, { binary: false })}</span>
      <span aria-label="图片尺寸">
        {item.width} × {item.height}
      </span>
      {item.captured_at && (
        <time dateTime={item.captured_at}>
          {formatTime(new Date(item.captured_at), "YYYY-MM-DD HH:mm")}
        </time>
      )}
    </div>
  );
}
