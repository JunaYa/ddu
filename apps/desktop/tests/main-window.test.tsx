import type { HistoryItem } from "@ddu/native";
import { mockNative, type MockNativeOptions, resetNativeMock } from "@ddu/native/testing";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { MainWindow } from "../src/windows/main/main-window.tsx";

// Canvas drawing is unavailable in jsdom; record what would be combined instead.
const composed = vi.hoisted(() => ({ calls: [] as Array<{ sources: string[]; layout: string }> }));
vi.mock("../src/windows/main/composite.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/windows/main/composite.ts")>()),
  composeImages: async (sources: string[], layout: string) => {
    composed.calls.push({ sources, layout });
    return "COMBINED";
  },
}));

afterEach(() => {
  cleanup();
  resetNativeMock();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  composed.calls.length = 0;
  delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
});

/** Give the masonry grid a real size so it renders cards in jsdom. */
function stubLayout() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        const entry = {
          target,
          contentRect: { width: 900, height: 800 },
        } as unknown as ResizeObserverEntry;
        this.callback([entry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  for (const prop of ["offsetHeight", "clientHeight"]) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => 800 });
  }
}

function item(name: string, capturedAt: string, size = 1234): HistoryItem {
  return {
    id: name,
    filename: name,
    full_path: `/shots/images/${name}`,
    width: 10,
    height: 10,
    file_size: size,
    mode: "capture",
    captured_at: capturedAt,
    favorite: false,
    tags: [],
  };
}

const OLD = item("screenshot_1.png", "2026-10-01T10:00:00Z");
const NEW = item("screenshot_2.png", "2026-10-02T10:00:00Z", 2_500_000);

function setup(options: MockNativeOptions & { items?: HistoryItem[] } = {}) {
  let items = options.items ?? [OLD, NEW];
  const dialogAnswers: string[] = [];
  const mock = mockNative({
    window: "main",
    ...options,
    plugins: {
      "plugin:fs|stat": () => {
        throw "forbidden path";
      },
      "plugin:dialog|message": () => dialogAnswers.shift() ?? "Cancel",
      ...options.plugins,
    },
    commands: {
      list_history_items: () => items,
      get_image_base64: () => "QUJD",
      search_history_text: ({ query }) => (query === "error" ? [NEW.id] : []),
      ocr_index_items: ({ paths }) => paths.length,
      delete_history_items: ({ paths }) => {
        items = items.filter((i) => !paths.includes(i.full_path));
        return paths.length;
      },
      open_combined_image: () => undefined,
      ...options.commands,
    },
  });
  render(
    <WindowShell>
      <MainWindow />
    </WindowShell>,
  );
  return { mock, answerNextDialog: (answer: "Ok" | "Cancel") => dialogAnswers.push(answer) };
}

const called = (mock: { calls: Array<[string, unknown]> }, cmd: string) =>
  mock.calls.filter(([name]) => name === cmd);

async function showList() {
  fireEvent.click(await screen.findByRole("button", { name: "Display as list" }));
}

const rowNames = () =>
  screen.getAllByRole("checkbox", { name: /^选择 / }).map((box) => box.getAttribute("aria-label"));

test("lists screenshots newest first and toggles the order", async () => {
  setup();
  await showList();
  await waitFor(() =>
    expect(rowNames()).toEqual(["选择 screenshot_2.png", "选择 screenshot_1.png"]),
  );
  expect(screen.getByText("Total").textContent).toContain("2");

  fireEvent.click(screen.getByRole("button", { name: "Sort by datetime, newest first" }));
  expect(rowNames()).toEqual(["选择 screenshot_1.png", "选择 screenshot_2.png"]);
});

test("file info shows the size from the history list even when stat is refused", async () => {
  setup();
  await showList();
  expect(await screen.findByText("2.5 MB")).toBeTruthy();
});

test("searching filters to indexed matches and clears the selection", async () => {
  setup();
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  fireEvent.click(screen.getByRole("checkbox", { name: "选择 screenshot_2.png" }));
  expect(
    screen.getByRole("checkbox", { name: "选择 screenshot_2.png" }).getAttribute("aria-checked"),
  ).toBe("true");

  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "error" } });
  await waitFor(() => expect(rowNames()).toEqual(["选择 screenshot_2.png"]));
  expect(screen.getByText("Matches").textContent).toContain("1");
  expect(
    screen.getByRole("checkbox", { name: "选择 screenshot_2.png" }).getAttribute("aria-checked"),
  ).toBe("false");

  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nothing" } });
  expect(await screen.findByText(/没有截图包含“nothing”/)).toBeTruthy();
});

test("select all, then move the selection to the Trash after confirming", async () => {
  const { mock, answerNextDialog } = setup();
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  answerNextDialog("Ok");
  fireEvent.click(screen.getByText("全部"));
  fireEvent.click(screen.getByRole("button", { name: "将所选截图移到废纸篓" }));

  await waitFor(() =>
    expect(called(mock, "delete_history_items")).toEqual([
      ["delete_history_items", { paths: [NEW.full_path, OLD.full_path] }],
    ]),
  );
  const [, prompt] = called(mock, "plugin:dialog|message")[0] ?? [];
  expect(prompt).toMatchObject({ message: "是否确认将 2 个截图移到废纸篓？" });
  await waitFor(() =>
    expect(screen.queryAllByRole("checkbox", { name: /^选择 / })).toHaveLength(0),
  );
});

test("deleting one screenshot goes through the backend, to the Trash", async () => {
  const { mock, answerNextDialog } = setup();
  await showList();
  answerNextDialog("Ok");
  fireEvent.click(await screen.findByRole("button", { name: "删除 screenshot_1.png" }));
  await waitFor(() =>
    expect(called(mock, "delete_history_items")).toEqual([
      ["delete_history_items", { paths: [OLD.full_path] }],
    ]),
  );
  expect(called(mock, "plugin:fs|remove")).toHaveLength(0);
});

test("cancelling a delete keeps everything", async () => {
  const { mock, answerNextDialog } = setup();
  await showList();
  answerNextDialog("Cancel");
  fireEvent.click(await screen.findByRole("button", { name: "删除 screenshot_1.png" }));
  await waitFor(() => expect(called(mock, "plugin:dialog|message")).toHaveLength(1));
  expect(called(mock, "delete_history_items")).toHaveLength(0);
});

test("indexing the selection reports full and partial results", async () => {
  let indexed = 2;
  const { mock } = setup({ commands: { ocr_index_items: () => indexed } });
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  fireEvent.click(screen.getByText("全部"));
  fireEvent.click(screen.getByRole("button", { name: "建立文字索引" }));
  expect(await screen.findByText("已为 2 张截图建立文字索引")).toBeTruthy();
  expect(called(mock, "ocr_index_items")[0]?.[1]).toEqual({
    paths: [NEW.full_path, OLD.full_path],
  });

  indexed = 1;
  fireEvent.click(screen.getByRole("button", { name: "建立文字索引" }));
  expect(await screen.findByText("已索引 1 / 2 张，其余识别失败")).toBeTruthy();
});

test("combining is offered only with two or more selected", async () => {
  setup();
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  fireEvent.click(screen.getByRole("checkbox", { name: "选择 screenshot_1.png" }));
  expect(screen.queryByRole("button", { name: "竖排" })).toBeNull();
  fireEvent.click(screen.getByRole("checkbox", { name: "选择 screenshot_2.png" }));
  expect(screen.getByRole("button", { name: "竖排" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "横排" })).toBeTruthy();
});

test("an empty history shows the empty state", async () => {
  setup({ items: [] });
  expect(await screen.findByText("还没有截图")).toBeTruthy();
  const selectAll = within(screen.getByText("全部").parentElement as HTMLElement).getByRole(
    "checkbox",
  );
  expect(
    selectAll.getAttribute("aria-disabled") ?? selectAll.hasAttribute("disabled"),
  ).toBeTruthy();
});

test("a history load failure is shown", async () => {
  setup({
    commands: {
      list_history_items: () => {
        throw "images dir missing";
      },
    },
  });
  expect(await screen.findByText(/无法读取截图历史/, undefined, { timeout: 5000 })).toBeTruthy();
});

test("grid view (the default) deletes a card through the backend", async () => {
  stubLayout();
  const { mock, answerNextDialog } = setup();
  answerNextDialog("Ok");
  fireEvent.click(await screen.findByRole("button", { name: "删除 screenshot_2.png" }));
  await waitFor(() =>
    expect(called(mock, "delete_history_items")).toEqual([
      ["delete_history_items", { paths: [NEW.full_path] }],
    ]),
  );
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "删除 screenshot_2.png" })).toBeNull(),
  );
  expect(screen.getByRole("button", { name: "删除 screenshot_1.png" })).toBeTruthy();
  expect(screen.getByText("Total").textContent).toContain("1");
});

test("refreshes history after a partial deletion rejects with a filesystem error", async () => {
  let items = [OLD, NEW];
  const { answerNextDialog } = setup({
    commands: {
      list_history_items: () => items,
      delete_history_items: () => {
        items = [OLD];
        throw "Permission denied: screenshot_1.png";
      },
    },
  });
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  answerNextDialog("Ok");
  fireEvent.click(screen.getByText("全部"));
  fireEvent.click(screen.getByRole("button", { name: "将所选截图移到废纸篓" }));
  expect(await screen.findByText("删除失败：Permission denied: screenshot_1.png")).toBeTruthy();
  await waitFor(() => expect(rowNames()).toEqual(["选择 screenshot_1.png"]));
});

test("combining sends the selected images, in display order, and refreshes the list", async () => {
  const { mock } = setup();
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  fireEvent.click(screen.getByText("全部"));
  const listsBefore = called(mock, "list_history_items").length;
  fireEvent.click(screen.getByRole("button", { name: "竖排" }));

  await waitFor(() =>
    expect(called(mock, "open_combined_image")).toEqual([
      ["open_combined_image", { base64: "COMBINED" }],
    ]),
  );
  expect(composed.calls).toEqual([
    { sources: ["data:image/png;base64,QUJD", "data:image/png;base64,QUJD"], layout: "vertical" },
  ]);
  const fetched = called(mock, "get_image_base64").map(
    ([, args]) => (args as { path: string }).path,
  );
  expect(fetched.slice(-2)).toEqual([NEW.full_path, OLD.full_path]);
  await waitFor(() =>
    expect(called(mock, "list_history_items").length).toBeGreaterThan(listsBefore),
  );
});

test("indexing refreshes the active search, and a failure is reported", async () => {
  let fail = false;
  const { mock } = setup({
    commands: {
      ocr_index_items: ({ paths }) => {
        if (fail) throw "OCR engine unavailable";
        return paths.length;
      },
    },
  });
  await showList();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "error" } });
  await waitFor(() => expect(rowNames()).toEqual(["选择 screenshot_2.png"]));
  const searchesBefore = called(mock, "search_history_text").length;

  fireEvent.click(screen.getByText("全部"));
  fireEvent.click(screen.getByRole("button", { name: "建立文字索引" }));
  expect(await screen.findByText("已为 1 张截图建立文字索引")).toBeTruthy();
  await waitFor(() =>
    expect(called(mock, "search_history_text").length).toBeGreaterThan(searchesBefore),
  );

  fail = true;
  fireEvent.click(screen.getByRole("button", { name: "建立文字索引" }));
  expect(await screen.findByText("建立索引失败: OCR engine unavailable")).toBeTruthy();
});

test("a delete the backend could only partly do is reported", async () => {
  const { answerNextDialog } = setup({ commands: { delete_history_items: () => 0 } });
  await showList();
  answerNextDialog("Ok");
  fireEvent.click(await screen.findByRole("button", { name: "删除 screenshot_1.png" }));
  expect(await screen.findByText("删除失败：只移动了 0 / 1 张截图")).toBeTruthy();
});

test("a failed search is reported and keeps the full list", async () => {
  setup({
    commands: {
      search_history_text: () => {
        throw "index unreadable";
      },
    },
  });
  await showList();
  await waitFor(() => expect(rowNames()).toHaveLength(2));
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "error" } });
  expect(await screen.findByText(/搜索失败/, undefined, { timeout: 5000 })).toBeTruthy();
  expect(rowNames()).toHaveLength(2);
});

test("typing quickly searches only the settled query", async () => {
  const { mock } = setup();
  await showList();
  const box = await screen.findByRole("searchbox");
  for (const value of ["e", "er", "err", "erro", "error"])
    fireEvent.change(box, { target: { value } });
  await waitFor(() => expect(rowNames()).toEqual(["选择 screenshot_2.png"]));
  expect(
    called(mock, "search_history_text").map(([, args]) => (args as { query: string }).query),
  ).toEqual(["error"]);
});

test("deleting in the grid keeps retained images visible throughout a delayed refresh", async () => {
  stubLayout();
  let reads = 0;
  let finishRefresh: (() => void) | undefined;
  const { mock, answerNextDialog } = setup({
    commands: {
      list_history_items: () => {
        if (++reads === 1) return [OLD, NEW];
        return new Promise<HistoryItem[]>((resolve) => {
          finishRefresh = () => resolve([OLD]);
        });
      },
    },
  });
  const retained = await screen.findByRole("img", { name: OLD.filename });
  const cell = retained.closest('[role="gridcell"]') as HTMLElement;
  await waitFor(() => expect(cell.style.visibility).not.toBe("hidden"));
  const imageReads = called(mock, "get_image_base64").length;
  const mutations: MutationRecord[] = [];
  const observer = new MutationObserver((records) => mutations.push(...records));
  observer.observe(cell, { attributes: true, attributeFilter: ["style"], attributeOldValue: true });
  try {
    answerNextDialog("Ok");
    fireEvent.click(screen.getByRole("button", { name: `删除 ${NEW.filename}` }));
    await waitFor(() => expect(finishRefresh).toBeTypeOf("function"));
    expect(screen.getByRole("img", { name: OLD.filename })).toBe(retained);
    expect(cell.style.visibility).not.toBe("hidden");
    finishRefresh!();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: `删除 ${NEW.filename}` })).toBeNull(),
    );
    mutations.push(...observer.takeRecords());
    expect(screen.getByRole("img", { name: OLD.filename })).toBe(retained);
    expect(retained.closest('[role="gridcell"]')).toBe(cell);
    expect(mutations.some((record) => record.oldValue?.includes("visibility: hidden"))).toBe(false);
    expect(cell.style.visibility).not.toBe("hidden");
    expect(called(mock, "get_image_base64")).toHaveLength(imageReads);
  } finally {
    observer.disconnect();
  }
});
