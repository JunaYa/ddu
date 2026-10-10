import { Button } from "@ddu/ui/button";
import { Checkbox } from "@ddu/ui/checkbox";
import { Trash2 } from "lucide-react";
import type { CompositeLayout } from "./composite.ts";

interface SelectionBarProps {
  visibleCount: number;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
  onDelete: () => void;
  deleting: boolean;
  onIndex: () => void;
  indexing: boolean;
  indexNotice: string | null;
  onCombine: (layout: CompositeLayout) => void;
  combining: boolean;
}

export function SelectionBar(props: SelectionBarProps) {
  const some = props.selectedCount > 0;
  return (
    <div className="surface-glass my-4 flex items-center gap-4 rounded-lg px-3 py-2">
      <label className="flex items-center gap-2">
        <span>全部</span>
        <Checkbox
          checked={props.allSelected}
          indeterminate={some && !props.allSelected}
          disabled={props.visibleCount === 0}
          onCheckedChange={(checked) => props.onSelectAll(checked)}
        />
      </label>
      {some && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="将所选截图移到废纸篓"
            disabled={props.deleting}
            onClick={props.onDelete}
          >
            <Trash2 />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="识别所选截图中的文字，以便搜索 OCR selected screenshots so they can be searched"
            disabled={props.indexing}
            onClick={props.onIndex}
          >
            {props.indexing ? "识别中…" : "建立文字索引"}
          </Button>
        </>
      )}
      {props.indexNotice && (
        <span role="status" className="text-sm text-muted-foreground">
          {props.indexNotice}
        </span>
      )}
      {props.selectedCount >= 2 && (
        <div className="flex items-center gap-2">
          <span className="text-sm">拼合</span>
          <Button
            variant="outline"
            size="sm"
            disabled={props.combining}
            onClick={() => props.onCombine("vertical")}
          >
            竖排
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={props.combining}
            onClick={() => props.onCombine("horizontal")}
          >
            横排
          </Button>
        </div>
      )}
    </div>
  );
}
