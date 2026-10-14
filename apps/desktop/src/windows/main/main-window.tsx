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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { composeImages, type CompositeLayout } from "./composite.ts";
import emptyImage from "./empty.png";
import { historyKeys, useDebouncedValue, useHistoryItems, useTextSearch } from "./history-data.ts";
import { HistoryCard, HistoryRow } from "./history-item.tsx";
import { SelectionBar } from "./selection-bar.tsx";
import { type DisplayMode, Toolbar } from "./toolbar.tsx";

const SEARCH_DEBOUNCE_MS = 200;

/** Keep the masonry renderer stable while sharing selection and actions. */
const ItemContext = createContext<{
  selected: ReadonlySet<string>;
  onDelete: (item: HistoryItem) => void;
  onSelect: (id: string, checked: boolean, shiftKey?: boolean) => void;
} | null>(null);

function MasonryCell({ data }: RenderComponentProps<HistoryItem>) {
  const context = useContext(ItemContext);
  if (!context) throw new Error("MasonryCell rendered outside ItemContext");
  return (
    <HistoryCard
      item={data}
      onDelete={context.onDelete}
      checked={context.selected.has(data.id)}
      selectionMode={context.selected.size > 0}
      onSelect={context.onSelect}
    />
  );
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
  const anchor = useRef<string | null>(null);
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
    anchor.current = null;
    // Only visible items stay selectable, so actions never touch hidden ones.
    setSelected(new Set());
  }

  const toggle = useCallback(
    (id: string, checked: boolean, shiftKey = false) => {
      const start = visible.findIndex((item) => item.id === anchor.current);
      const end = visible.findIndex((item) => item.id === id);
      const ids =
        shiftKey && start >= 0 && end >= 0
          ? visible.slice(Math.min(start, end), Math.max(start, end) + 1).map((item) => item.id)
          : [id];
      anchor.current = id;
      setSelected((current) => {
        const next = new Set(current);
        for (const key of ids) {
          if (checked) next.add(key);
          else next.delete(key);
        }
        return next;
      });
    },
    [visible],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, [contenteditable=true], [role=dialog]")
      )
        return;
      if (event.key === "Escape") {
        setSelected(new Set());
        anchor.current = null;
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelected(new Set(visible.map((item) => item.id)));
        anchor.current = visible[0]?.id ?? null;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: historyKeys.list, exact: true }),
      queryClient.invalidateQueries({ queryKey: ["history", "search"] }),
    ]);

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
    <main ref={scrollRef} className="h-screen overflow-y-auto bg-background p-4 pb-28">
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
          <ItemContext value={{ selected, onDelete: deleteOne, onSelect: toggle }}>
            <VirtualMasonry
              items={visible}
              getItemKey={(item) => item.id}
              renderItem={MasonryCell}
              scrollRef={scrollRef}
              columnWidth={{ base: 160, sm: 192, lg: 240 }}
              gap={12}
              itemHeightEstimate={280}
              role="grid"
            />
          </ItemContext>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                onDelete={deleteOne}
                checked={selected.has(item.id)}
                selectionMode={selectedItems.length > 0}
                onSelect={toggle}
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
