import { copyImageBytes, copyText, recognizeText, saveAnnotatedImage } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ocrLines } from "../ocr.ts";
import { createEditor, type Editor } from "./editor.ts";
import { EditorToolbar } from "./editor-toolbar.tsx";
import { OcrPanel, type OcrState } from "./ocr-panel.tsx";

export function ImageEditor({
  imageSrc,
  imagePath,
  autoOcr = false,
  onClose,
  onSaved,
}: {
  imageSrc: string;
  imagePath: string;
  autoOcr?: boolean;
  onClose: () => void;
  onSaved: (path: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [, rerender] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(false);
  const ocrRequest = useRef(0);
  const [ocr, setOcr] = useState<OcrState | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    alive.current = true;
    const stage = stageRef.current!;
    const bounds = containerRef.current!.getBoundingClientRect();
    // Each effect owns a fresh canvas, including StrictMode's mount probe.
    const canvas = document.createElement("canvas");
    stage.appendChild(canvas);
    let disposed = false;
    const controller = createEditor(() => {
      if (!disposed) rerender((n) => n + 1);
    });
    controller.initCanvas(
      canvas,
      Math.max(200, bounds.width - 32),
      Math.max(160, bounds.height - 32),
    );
    void controller
      .loadImage(imageSrc)
      .then(() => {
        if (!disposed) {
          controller.setTool("select");
          setEditor(controller);
        }
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(`无法加载编辑器：${String(cause)}`);
      });
    return () => {
      disposed = true;
      alive.current = false;
      ocrRequest.current++;
      controller.destroy();
      stage.replaceChildren();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function run(action: () => void | Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      if (alive.current) setError(String(cause));
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input, textarea, [contenteditable=true]")
    )
      return;
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (!editor || busy) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      void run(() => (event.shiftKey ? editor.redo() : editor.undo()));
    } else if (
      (event.key === "Delete" || event.key === "Backspace") &&
      editor.getState().currentTool === "select"
    ) {
      event.preventDefault();
      editor.deleteSelected();
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function readText(wholeImage = false) {
    if (!editor) return;
    const request = ++ocrRequest.current;
    const region =
      !wholeImage && editor.getState().currentTool === "select"
        ? editor.selectedImageRegion()
        : null;
    setHovered(null);
    setOcr({ loading: true, error: "", partial: !!region, lines: [] });
    try {
      const result = await recognizeText(imagePath, region);
      if (alive.current && request === ocrRequest.current)
        setOcr({ loading: false, error: "", partial: !!region, lines: ocrLines(result) });
    } catch (cause) {
      if (alive.current && request === ocrRequest.current)
        setOcr({
          loading: false,
          error: `识别失败：${String(cause)}`,
          partial: !!region,
          lines: [],
        });
    }
  }

  const startAutoOcr = useEffectEvent(() => {
    void readText(true);
  });
  useEffect(() => {
    if (autoOcr && editor) startAutoOcr();
  }, [autoOcr, editor, imagePath]);

  const box = hovered === null ? null : ocr?.lines[hovered]?.box;
  const highlight = box && editor?.imageRectToCanvas(box);
  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      <EditorToolbar editor={editor} run={(action) => void run(action)} />
      <div className="flex flex-wrap justify-end gap-2 border-b p-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!editor || busy || ocr?.loading}
          aria-label="提取文字 Extract text"
          onClick={() => void readText()}
        >
          提取文字
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!editor || busy}
          aria-label="复制编辑后的截图 Copy edited screenshot"
          onClick={() =>
            void run(async () => {
              await copyImageBytes(editor!.exportImage().split(",")[1]!);
              if (alive.current) setNotice("已复制到剪贴板");
            })
          }
        >
          复制
        </Button>
        <Button
          size="sm"
          disabled={!editor || busy}
          aria-label="保存编辑副本 Save edited copy"
          onClick={() =>
            void run(async () => {
              const path = await saveAnnotatedImage(
                editor!.exportImage().split(",")[1]!,
                imagePath,
              );
              if (alive.current) onSaved(path);
            })
          }
        >
          保存副本
        </Button>
        <Button size="sm" variant="ghost" aria-label="关闭编辑器 Close editor" onClick={onClose}>
          关闭
        </Button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="size-full overflow-auto bg-muted/40 p-4">
          <div ref={stageRef} className="relative w-fit">
            {highlight && (
              <div
                data-testid="ocr-highlight"
                className="pointer-events-none absolute z-10 bg-primary/15 outline-2 outline-primary"
                style={{
                  left: highlight.x,
                  top: highlight.y,
                  width: highlight.width,
                  height: highlight.height,
                }}
              />
            )}
          </div>
        </div>
        {ocr && (
          <OcrPanel
            state={ocr}
            onHover={setHovered}
            onClose={() => {
              ocrRequest.current++;
              setOcr(null);
              setHovered(null);
            }}
            onCopy={(text) =>
              void run(async () => {
                await copyText(text);
                if (alive.current) setNotice("文字已复制");
              })
            }
          />
        )}
      </div>
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`border-t px-3 py-2 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {error || notice}
        </p>
      )}
    </main>
  );
}
