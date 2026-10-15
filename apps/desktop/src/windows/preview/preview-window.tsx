import {
  copyCapture,
  copyText,
  dragPreview,
  expandPreview,
  hidePreview,
  imageDataUrl,
  on,
  recognizeText,
  takeImportedImage,
  type CapturePrepared,
} from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Copy, FileText, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageEditor } from "./editor/image-editor.tsx";
import { joinOcrLines, ocrLines } from "./ocr.ts";
import { shouldAutoHidePreview } from "./preview-lifecycle.ts";

export function PreviewWindow() {
  const [capture, setCapture] = useState<CapturePrepared | null>(null);
  const [image, setImage] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const generation = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    let disposed = false;
    const stops: Array<() => void> = [];
    function receive(next: CapturePrepared) {
      if (disposed) return;
      generation.current++;
      pending.current = false;
      setCapture(next);
      setImage("");
      setEditing(next.mode === "imported");
      setBusy(false);
      setNotice("");
      setError(next.copyError ?? "");
    }
    async function receiveImport() {
      const version = generation.current;
      try {
        const next = await takeImportedImage();
        if (!disposed && version === generation.current && next) receive(next);
      } catch (cause) {
        if (!disposed) setError(String(cause));
      }
    }
    async function subscribe() {
      for (const subscription of [
        () => on("image-prepared", receive),
        () => on("imported-image-ready", () => void receiveImport()),
      ]) {
        const stop = await subscription();
        if (disposed) {
          stop();
          return;
        }
        stops.push(stop);
      }
      await receiveImport();
    }
    void subscribe().catch((cause: unknown) => {
      if (!disposed) setError(String(cause));
    });
    return () => {
      disposed = true;
      generation.current++;
      stops.forEach((stop) => stop());
    };
  }, []);

  useEffect(() => {
    if (!capture) return;
    let disposed = false;
    void imageDataUrl(capture.fullPath)
      .then((src) => {
        if (!disposed) setImage(src);
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(`无法加载图片：${String(cause)}`);
      });
    return () => {
      disposed = true;
    };
  }, [capture]);

  useEffect(() => {
    if (!capture || !shouldAutoHidePreview({ hovered: hovered || focused, editing, busy })) return;
    const timer = setTimeout(() => {
      void hidePreview().catch((cause: unknown) => setError(String(cause)));
    }, 5000);
    return () => clearTimeout(timer);
  }, [capture, hovered, focused, editing, busy]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function perform(action: () => Promise<void>) {
    if (pending.current) return;
    const version = generation.current;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      if (version === generation.current) setError(String(cause));
    } finally {
      if (version === generation.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  if (editing && capture && image)
    return (
      <ImageEditor
        key={capture.fullPath}
        imageSrc={image}
        imagePath={capture.fullPath}
        autoOcr={capture.mode === "imported"}
        onClose={() => {
          setEditing(false);
          if (capture.mode === "imported") void perform(hidePreview);
        }}
        onSaved={() => {
          setEditing(false);
          if (capture.mode === "imported") void perform(hidePreview);
        }}
      />
    );

  return (
    <main
      className="group relative h-screen overflow-hidden rounded-lg bg-background/70 text-foreground"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onMouseDown={(event) => {
        if (event.button === 0 && !(event.target as HTMLElement).closest("button"))
          void dragPreview().catch((cause: unknown) => setError(String(cause)));
      }}
    >
      {image ? (
        <img
          src={image}
          alt="截图预览"
          draggable={false}
          className="size-full select-none object-contain"
        />
      ) : (
        <p role="status" className="p-3 text-xs text-muted-foreground">
          {capture ? "正在加载截图…" : "等待截图…"}
        </p>
      )}
      <div className="absolute inset-0 grid grid-cols-2 content-center gap-1 bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
        <Button
          size="sm"
          variant="ghost"
          aria-label="编辑截图 Edit screenshot"
          disabled={!image || busy}
          onClick={() =>
            void perform(async () => {
              const version = generation.current;
              await expandPreview();
              if (version === generation.current) setEditing(true);
            })
          }
        >
          <Pencil />
          编辑
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="复制截图 Copy screenshot"
          disabled={!capture || busy}
          onClick={() =>
            void perform(async () => {
              const version = generation.current;
              await copyCapture(capture!.fullPath);
              if (version === generation.current) setNotice("已复制");
            })
          }
        >
          <Copy />
          复制
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="提取并复制文字 Copy text"
          disabled={!capture || busy}
          onClick={() =>
            void perform(async () => {
              const version = generation.current;
              const lines = ocrLines(await recognizeText(capture!.fullPath));
              if (version !== generation.current) return;
              if (!lines.length) {
                setNotice("未识别到文字");
                return;
              }
              await copyText(
                joinOcrLines(
                  lines.map((line) => line.text),
                  false,
                ),
              );
              if (version === generation.current) setNotice(`已复制 ${lines.length} 行文字`);
            })
          }
        >
          <FileText />
          文字
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="关闭预览 Close preview"
          onClick={() => void perform(hidePreview)}
        >
          <X />
          关闭
        </Button>
      </div>
      {(error || notice || busy) && (
        <p
          role={error ? "alert" : "status"}
          className="pointer-events-none absolute inset-x-1 bottom-1 rounded bg-background/95 p-1 text-center text-xs"
        >
          {error || (busy ? "处理中…" : notice)}
        </p>
      )}
    </main>
  );
}
