import { Button } from "@ddu/ui/button";
import { Checkbox } from "@ddu/ui/checkbox";
import { X } from "lucide-react";
import { useState } from "react";
import { joinOcrLines, type OcrLine } from "../ocr.ts";

export interface OcrState {
  loading: boolean;
  error: string;
  partial: boolean;
  lines: OcrLine[];
}
export function OcrPanel({
  state,
  onCopy,
  onHover,
  onClose,
}: {
  state: OcrState;
  onCopy: (text: string) => void;
  onHover: (index: number | null) => void;
  onClose: () => void;
}) {
  const [merge, setMerge] = useState(false);
  return (
    <aside
      aria-label="识别文字 Recognized text"
      className="absolute inset-y-0 right-0 z-10 flex w-80 max-w-full flex-col border-l bg-background shadow-lg"
    >
      <header className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-medium">{state.partial ? "选区文字" : "识别文字"}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="关闭文字面板 Close text panel"
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      {state.loading ? (
        <p role="status" className="p-4">
          正在识别…
        </p>
      ) : state.error ? (
        <p role="alert" className="p-4 text-destructive">
          {state.error}
        </p>
      ) : !state.lines.length ? (
        <p className="p-4 text-muted-foreground">未识别到文字</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={merge} onCheckedChange={setMerge} />
              合并换行
            </label>
            <Button
              size="sm"
              onClick={() =>
                onCopy(
                  joinOcrLines(
                    state.lines.map((line) => line.text),
                    merge,
                  ),
                )
              }
            >
              复制全部
            </Button>
          </div>
          <ol className="flex-1 overflow-auto p-2">
            {state.lines.map((line, index) => (
              <li key={index}>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start whitespace-pre-wrap break-words text-left font-normal"
                  title={`复制此行 ${index + 1}`}
                  onClick={() => onCopy(line.text)}
                  onMouseEnter={() => onHover(index)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(index)}
                  onBlur={() => onHover(null)}
                >
                  {line.text}
                </Button>
              </li>
            ))}
          </ol>
        </>
      )}
    </aside>
  );
}
