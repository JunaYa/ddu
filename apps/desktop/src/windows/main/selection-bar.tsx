import { Button } from "@ddu/ui/button";
import { Checkbox } from "@ddu/ui/checkbox";
import { Trash2, X } from "lucide-react";
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
    <div className="my-4 flex min-h-8 flex-wrap items-center gap-4 px-1 text-sm">
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
        <div
          role="toolbar"
          aria-label="所选截图操作"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-3xl bg-foreground px-3 py-2 text-background shadow-xl [&_button]:text-background [&_button:hover]:bg-background/15 [&_button]:border-background/25">
            <span aria-live="polite" className="px-2 text-sm font-semibold tabular-nums">
              已选 {props.selectedCount} 项
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="取消选择"
              onClick={() => props.onSelectAll(false)}
            >
              <X />
            </Button>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-background/25" />
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
              variant="ghost"
              size="sm"
              title="识别所选截图中的文字，以便搜索 OCR selected screenshots so they can be searched"
              disabled={props.indexing}
              onClick={props.onIndex}
            >
              {props.indexing ? "识别中…" : "建立文字索引"}
            </Button>
            {props.selectedCount >= 2 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">拼合</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={props.combining}
                  onClick={() => props.onCombine("vertical")}
                >
                  竖排
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={props.combining}
                  onClick={() => props.onCombine("horizontal")}
                >
                  横排
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {props.indexNotice && (
        <span role="status" className="text-sm text-muted-foreground">
          {props.indexNotice}
        </span>
      )}
    </div>
  );
}
