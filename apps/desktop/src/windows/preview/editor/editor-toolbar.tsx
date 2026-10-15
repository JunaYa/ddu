import { Button } from "@ddu/ui/button";
import { Slider } from "@ddu/ui/slider";
import {
  ArrowUpRight,
  Circle,
  Eraser,
  Hash,
  Highlighter,
  Minus,
  MousePointer2,
  Pencil,
  Redo2,
  Scan,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import type { Editor, ToolType } from "./editor.ts";

const tools = [
  ["select", "Select", MousePointer2],
  ["arrow", "Arrow", ArrowUpRight],
  ["line", "Line", Minus],
  ["rect", "Rect", Square],
  ["ellipse", "Ellipse", Circle],
  ["freehand", "Draw", Pencil],
  ["highlight", "Highlight", Highlighter],
  ["text", "Text", Type],
  ["step", "Step", Hash],
  ["blur", "Blur (soft — not for secrets)", Scan],
  ["pixelate", "Pixelate (irreversible)", Eraser],
] as const;
const colors = [
  "#ff0000",
  "#ff6600",
  "#ffcc00",
  "#00cc00",
  "#0066ff",
  "#9933ff",
  "#000000",
  "#ffffff",
];

export function EditorToolbar({
  editor,
  run,
}: {
  editor: Editor | null;
  run: (action: () => void | Promise<void>) => void;
}) {
  const state = editor?.getState();
  return (
    <div
      aria-label="标注工具"
      role="toolbar"
      className="flex flex-wrap items-center gap-2 border-b p-2"
    >
      <div className="flex flex-wrap gap-0.5">
        {tools.map(([id, label, Icon]) => (
          <Button
            key={id}
            title={label}
            aria-label={label}
            aria-pressed={state?.currentTool === id}
            variant={state?.currentTool === id ? "primary-muted" : "ghost"}
            size="icon-sm"
            disabled={!editor || state?.restoring}
            onClick={() => editor?.setTool(id as ToolType)}
          >
            <Icon />
          </Button>
        ))}
      </div>
      <div className="flex gap-0.5">
        {colors.map((color) => (
          <Button
            key={color}
            size="icon-sm"
            variant="ghost"
            disabled={!editor || state?.restoring}
            aria-label={`Stroke color ${color}`}
            aria-pressed={state?.style.strokeColor === color}
            onClick={() => editor?.updateStyle({ strokeColor: color })}
          >
            <span
              className={`size-4 rounded-full border border-border ${state?.style.strokeColor === color ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
              style={{ backgroundColor: color }}
            />
          </Button>
        ))}
      </div>
      <div className="w-28 px-2">
        <Slider
          className="min-w-0!"
          min={1}
          max={20}
          step={1}
          value={state?.style.strokeWidth ?? 3}
          thumbAriaLabel="Stroke width"
          disabled={!editor || state?.restoring}
          onValueChange={(value) =>
            editor?.updateStyle({ strokeWidth: Array.isArray(value) ? value[0] : value })
          }
        />
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Undo"
        disabled={!state?.canUndo || state.restoring}
        onClick={() => run(() => editor?.undo())}
      >
        <Undo2 />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Redo"
        disabled={!state?.canRedo || state.restoring}
        onClick={() => run(() => editor?.redo())}
      >
        <Redo2 />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Delete selected annotation"
        disabled={!editor || state?.restoring}
        onClick={() => editor?.deleteSelected()}
      >
        <Trash2 />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Clear annotations"
        disabled={!editor || state?.restoring}
        onClick={() => editor?.clearAnnotations()}
      >
        <Eraser />
      </Button>
    </div>
  );
}
