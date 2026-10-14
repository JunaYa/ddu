import type { HistoryItem } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Card } from "@ddu/ui/card";
import { Checkbox } from "@ddu/ui/checkbox";
import { cn } from "@ddu/ui/lib/utils";
import { ImageIcon, Trash2 } from "lucide-react";
import { memo } from "react";
import { FileInfo } from "./file-info.tsx";
import { Thumbnail } from "./thumbnail.tsx";

interface ItemProps {
  item: HistoryItem;
  onDelete: (item: HistoryItem) => void;
  checked: boolean;
  selectionMode: boolean;
  onSelect: (id: string, checked: boolean, shiftKey?: boolean) => void;
}

function HistoryItemView({
  item,
  onDelete,
  checked,
  selectionMode,
  onSelect,
  list = false,
}: ItemProps & { list?: boolean }) {
  return (
    <Card
      role="group"
      aria-label={item.filename}
      data-selected={checked}
      className={cn(
        "group relative min-w-0 gap-0 rounded-xl border-border/70 p-0 shadow-none transition-[opacity,border-color,box-shadow] duration-150 motion-reduce:transition-none hover:border-input",
        checked && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        selectionMode && !checked && "opacity-50",
      )}
    >
      <Button
        variant="ghost"
        aria-label={`选择截图 ${item.filename}`}
        aria-pressed={checked}
        className={cn(
          "h-auto w-full min-w-0 justify-start overflow-hidden rounded-xl p-0 text-left font-normal hover:bg-muted/30",
          list ? "gap-3 p-2.5" : "flex-col items-stretch gap-0",
        )}
        onClick={(event) => onSelect(item.id, !checked, event.shiftKey)}
      >
        {!list && (
          <div className="flex items-center gap-1.5 px-3 py-2.5 pr-12 text-xs text-muted-foreground">
            <ImageIcon className="size-3.5" />
            截图
          </div>
        )}
        <div
          className={cn(
            "overflow-hidden bg-muted/40",
            list ? "h-10 w-14 shrink-0 rounded-md" : "mx-1 rounded-lg",
          )}
        >
          <Thumbnail
            path={item.full_path}
            width={item.width}
            height={item.height}
            className={list ? "h-10 w-14 object-cover" : "h-auto w-full"}
          />
        </div>
        <div className={cn("min-w-0 flex-1", list ? "pr-20" : "px-3 py-3")}>
          <div className="truncate text-sm font-medium" title={item.filename}>
            {item.filename}
          </div>
          <FileInfo item={item} />
        </div>
      </Button>
      <div
        className={cn(
          "absolute right-3 flex items-center gap-3",
          list ? "top-1/2 -translate-y-1/2" : "top-3 flex-col",
        )}
      >
        <Checkbox
          aria-label={`选择 ${item.filename}`}
          checked={checked}
          className={cn(
            "bg-card transition-opacity motion-reduce:transition-none",
            !selectionMode &&
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100",
          )}
          onCheckedChange={(value, details) =>
            onSelect(item.id, value, "shiftKey" in details.event && Boolean(details.event.shiftKey))
          }
        />
        {!selectionMode && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`删除 ${item.filename}`}
            className="bg-card/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100"
            onClick={() => onDelete(item)}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </Card>
  );
}

export const HistoryCard = memo(HistoryItemView);
export function HistoryRow(props: ItemProps) {
  return <HistoryItemView {...props} list />;
}
