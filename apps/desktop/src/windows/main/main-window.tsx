import {
  confirm,
  deleteHistoryItems,
  type HistoryItem,
  imageDataUrl,
  indexHistoryItems,
  openCombinedImage,
} from "@ddu/native";
import { Alert, AlertDescription } from "@ddu/ui/alert";
import { Empty, EmptyDescription } from "@ddu/ui/empty";
import { VirtualMasonry } from "@ddu/ui/virtual-masonry";
import type { RenderComponentProps } from "@ddu/ui/virtual-masonry";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { composeImages, type CompositeLayout } from "./composite.ts";
import emptyImage from "./empty.png";
import { historyKeys, useDebouncedValue, useHistoryItems, useTextSearch } from "./history-data.ts";
import { HistoryCard, HistoryRow } from "./history-item.tsx";
import { SelectionBar } from "./selection-bar.tsx";
import { type DisplayMode, Toolbar } from "./toolbar.tsx";

const SEARCH_DEBOUNCE_MS = 200;

/** Lets masonry cells (rendered by masonic) reach the window's delete action. */
const DeleteContext = createContext<((item: HistoryItem) => void) | null>(null);

function MasonryCell({ data }: RenderComponentProps<HistoryItem>) {
  const onDelete = useContext(DeleteContext);
  if (!onDelete) throw new Error("MasonryCell rendered outside DeleteContext");
  return <HistoryCard item={data} onDelete={onDelete} />;
}

const capturedAt = (item: HistoryItem) =>
  item.captured_at ? new Date(item.captured_at).getTime() : 0;

/** The history window (SnapVault): browse, search, select, index, combine, delete. */
export function MainWindow() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLElement>(null);
  const history = useHistoryItems();

  const [query, setQuery] = useState("");
  const search = useTextSearch(useDebouncedValue(query, SEARCH_DEBOUNCE_MS));
  const matches = search.matches;
  const [ascending, setAscending] = useState(false);
  const [display, setDisplay] = useState<DisplayMode>("grid");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [indexNotice, setIndexNotice] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const items = [...(history.data ?? [])];
    items.sort((a, b) =>
      ascending ? capturedAt(a) - capturedAt(b) : capturedAt(b) - capturedAt(a),
    );
    return items;
  }, [history.data, ascending]);
  const visible = useMemo(
    () => (matches ? sorted.filter((item) => matches.has(item.id)) : sorted),
    [sorted, matches],
  );
  const selectedItems = visible.filter((item) => selected.has(item.id));
  const allSelected = visible.length > 0 && selectedItems.length === visible.length;

  function changeQuery(next: string) {
    setQuery(next);
    // Only visible items stay selectable, so actions never touch hidden ones.
    setSelected(new Set());
  }

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: historyKeys.list });

  const removeItems = useMutation({
    mutationFn: async ({ items, message }: { items: HistoryItem[]; message: string }) => {
      if (!(await confirm(message, { title: "确认删除", kind: "warning" }))) return;
      try {
        const moved = await deleteHistoryItems(items.map((item) => item.full_path));
        setSelected(new Set());
        if (moved < items.length) throw new Error(`只移动了 ${moved} / ${items.length} 张截图`);
      } finally {
        // A batch can move some files before failing. Re-read disk even then.
        await refresh();
      }
    },
  });

  const { mutate: remove } = removeItems;
  // Stable, so masonry cards do not all re-render on every keystroke.
  const deleteOne = useCallback(
    (item: HistoryItem) => remove({ items: [item], message: "是否确认将该截图移到废纸篓？" }),
    [remove],
  );

  const index = useMutation({
    mutationFn: async (items: HistoryItem[]) => {
      setIndexNotice(`正在识别 ${items.length} 张截图…`);
      const count = await indexHistoryItems(items.map((item) => item.full_path));
      setIndexNotice(
        count === items.length
          ? `已为 ${count} 张截图建立文字索引`
          : `已索引 ${count} / ${items.length} 张，其余识别失败`,
      );
      await queryClient.invalidateQueries({ queryKey: ["history", "search"] });
    },
    onError: (error) => setIndexNotice(`建立索引失败: ${error.message}`),
  });

  const combine = useMutation({
    mutationFn: async ({ items, layout }: { items: HistoryItem[]; layout: CompositeLayout }) => {
      const sources = await Promise.all(items.map((item) => imageDataUrl(item.full_path)));
      await openCombinedImage(await composeImages(sources, layout));
    },
    // The combined image is saved as a new capture.
    onSuccess: refresh,
  });

  const searching = query.trim().length > 0;

  return (
    <main ref={scrollRef} className="h-screen overflow-y-auto bg-background/60 p-4">
      <Toolbar
        query={query}
        onQueryChange={changeQuery}
        matches={matches ? visible.length : null}
        total={sorted.length}
        ascending={ascending}
        onToggleSort={() => setAscending((value) => !value)}
        display={display}
        onToggleDisplay={() => setDisplay((mode) => (mode === "grid" ? "list" : "grid"))}
      />
      <SelectionBar
        visibleCount={visible.length}
        selectedCount={selectedItems.length}
        allSelected={allSelected}
        onSelectAll={(all) => setSelected(new Set(all ? visible.map((item) => item.id) : []))}
        onDelete={() =>
          removeItems.mutate({
            items: selectedItems,
            message: `是否确认将 ${selectedItems.length} 个截图移到废纸篓？`,
          })
        }
        deleting={removeItems.isPending}
        onIndex={() => index.mutate(selectedItems)}
        indexing={index.isPending}
        indexNotice={indexNotice}
        onCombine={(layout) => combine.mutate({ items: selectedItems, layout })}
        combining={combine.isPending}
      />
      {[
        history.error && `无法读取截图历史：${history.error.message}`,
        search.error && `搜索失败：${search.error.message}`,
        removeItems.error && `删除失败：${removeItems.error.message}`,
        combine.error && `拼合失败：${combine.error.message}`,
      ]
        .filter((message): message is string => Boolean(message))
        .map((message) => (
          <Alert key={message} variant="error" className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ))}

      {visible.length > 0 ? (
        display === "grid" ? (
          <DeleteContext value={deleteOne}>
            <VirtualMasonry
              items={visible}
              getItemKey={(item) => item.id}
              renderItem={MasonryCell}
              scrollRef={scrollRef}
              columnWidth={{ base: 280, md: 300 }}
              gap={16}
              itemHeightEstimate={280}
              role="grid"
            />
          </DeleteContext>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                onDelete={deleteOne}
                checked={selected.has(item.id)}
                onCheckedChange={(checked) => toggle(item.id, checked)}
              />
            ))}
          </div>
        )
      ) : searching && matches ? (
        <p className="py-12 text-center text-muted-foreground">
          没有截图包含“{query.trim()}”。只有建立过文字索引的截图可被搜索。
        </p>
      ) : history.isSuccess ? (
        <Empty>
          <img src={emptyImage} alt="" className="h-[430px] w-[340px]" />
          <EmptyDescription className="sr-only">还没有截图</EmptyDescription>
        </Empty>
      ) : null}
    </main>
  );
}
