import type { HistoryItem } from "@ddu/native";
import { formatFileSize, formatTime } from "@ddu/utils";
import { useFileTimes } from "./history-data.ts";

const FORMAT = "YYYY-MM-DD HH:mm:ss";
const show = (date: Date | null | undefined) => (date ? formatTime(new Date(date), FORMAT) : "");

/** Size and timestamps; `labelled` adds the row labels the grid card shows. */
export function FileInfo({ item, labelled = false }: { item: HistoryItem; labelled?: boolean }) {
  const times = useFileTimes(item.full_path).data;
  const rows: Array<[string, string]> = [
    ["size: ", formatFileSize(item.file_size, { binary: false })],
    ["最近修改: ", show(times?.modified)],
    ["最近访问: ", show(times?.accessed)],
    ["创建时间: ", show(times?.created)],
  ];
  return (
    <dl className={labelled ? "flex flex-col" : "flex flex-1 items-center justify-between gap-2"}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-2 text-sm text-muted-foreground">
          <dt className={labelled ? undefined : "sr-only"}>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
