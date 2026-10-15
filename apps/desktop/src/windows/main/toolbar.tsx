import { Button } from "@ddu/ui/button";
import { Input } from "@ddu/ui/input";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, List } from "lucide-react";

export type DisplayMode = "grid" | "list";

interface ToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Matching screenshots while a search is active, else `null`. */
  matches: number | null;
  total: number;
  ascending: boolean;
  onToggleSort: () => void;
  display: DisplayMode;
  onToggleDisplay: () => void;
  onOpenImage: () => void;
  openingImage: boolean;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <h1 className="text-lg font-bold">SnapVault</h1>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={props.onOpenImage} disabled={props.openingImage}>
          {props.openingImage ? "正在打开…" : "打开图片识别文字"}
        </Button>
        <Input
          type="search"
          className="w-48"
          placeholder="搜索截图文字 Search text"
          aria-label="搜索截图中的文字 Search text in screenshots"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
        />
        <span>
          {props.matches === null ? "Total" : "Matches"}
          <span className="mx-1 font-bold text-primary">{props.matches ?? props.total}</span>
        </span>
        <Button
          variant="ghost"
          onClick={props.onToggleSort}
          aria-label={
            props.ascending ? "Sort by datetime, oldest first" : "Sort by datetime, newest first"
          }
        >
          <span className="hidden text-sm lg:inline">拍摄时间</span>
          {props.ascending ? (
            <ArrowUpNarrowWide className="text-primary" />
          ) : (
            <ArrowDownWideNarrow className="text-primary" />
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={props.onToggleDisplay}
          aria-label={props.display === "grid" ? "Display as list" : "Display as grid"}
        >
          <span className="sr-only">Display</span>
          {props.display === "grid" ? (
            <LayoutGrid className="text-primary" />
          ) : (
            <List className="text-primary" />
          )}
        </Button>
      </div>
    </header>
  );
}
