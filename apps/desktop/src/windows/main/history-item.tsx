import type { HistoryItem } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Card } from "@ddu/ui/card";
import { Checkbox } from "@ddu/ui/checkbox";
import { Trash2 } from "lucide-react";
import { memo } from "react";
import { FileInfo } from "./file-info.tsx";
import { Thumbnail } from "./thumbnail.tsx";

interface ItemProps {
  item: HistoryItem;
  onDelete: (item: HistoryItem) => void;
}

function DeleteButton({ item, onDelete, className }: ItemProps & { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`删除 ${item.filename}`}
      className={className}
      onClick={() => onDelete(item)}
    >
      <Trash2 />
    </Button>
  );
}

/** Grid view card: full-width thumbnail, delete on hover, labelled file info. */
export const HistoryCard = memo(function HistoryCard({ item, onDelete }: ItemProps) {
  return (
    <Card className="group surface-glass relative gap-2 p-2">
      <Thumbnail path={item.full_path} className="h-auto w-full" />
      <DeleteButton
        item={item}
        onDelete={onDelete}
        className="absolute right-3 top-3 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
      <FileInfo item={item} labelled />
    </Card>
  );
});

/** List view row: selection, small thumbnail, inline file info, delete. */
export function HistoryRow({
  item,
  onDelete,
  checked,
  onCheckedChange,
}: ItemProps & { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <Card className="surface-glass flex-row items-center gap-4 p-2">
      <Checkbox
        aria-label={`选择 ${item.filename}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Thumbnail path={item.full_path} className="h-[60px] w-[100px]" />
      <FileInfo item={item} />
      <DeleteButton item={item} onDelete={onDelete} />
    </Card>
  );
}
