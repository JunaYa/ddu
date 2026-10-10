import { useSetting } from "@ddu/hooks";
import { clearOcrIndex, confirm, deleteHistoryItems, listHistoryItems } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@ddu/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ddu/ui/select";
import { Switch } from "@ddu/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { useId } from "react";
import { SettingCard } from "../setting-card.tsx";

const RETENTION_OPTIONS: Record<string, string> = {
  "7": "7 days",
  "30": "30 days",
  "90": "90 days",
  "-1": "Forever",
};

export function HistorySection() {
  const retentionId = useId();
  const cleanupId = useId();
  const ocrId = useId();
  const [retentionDays, setRetentionDays, retentionStatus] = useSetting("history_retention_days");
  const [cleanup, setCleanup, cleanupStatus] = useSetting("history_cleanup_enabled");
  const [ocrIndex, setOcrIndex, ocrStatus] = useSetting("ocr_index_enabled");

  // Turning the index off deletes the text already collected (spec 04 OCR-006).
  const disableOcrIndex = useMutation({
    mutationFn: async () => {
      const ok = await confirm("关闭后会删除已保存的截图文字索引，历史中将无法按文字搜索。", {
        title: "关闭文字索引",
        kind: "warning",
      });
      if (!ok) return;
      await clearOcrIndex();
      await setOcrIndex(false);
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      const ok = await confirm("这会将所有 DDU 截图移到废纸篓；你可以从 macOS 废纸篓恢复它们。", {
        title: "清空历史",
        kind: "warning",
      });
      if (!ok) return;
      const items = await listHistoryItems();
      if (items.length > 0) await deleteHistoryItems(items.map((item) => item.full_path));
    },
  });

  const settingError = retentionStatus.error ?? cleanupStatus.error ?? ocrStatus.error;

  return (
    <SettingCard title="截图历史">
      <Field orientation="horizontal">
        <FieldLabel htmlFor={retentionId}>保留期限</FieldLabel>
        <Select
          items={RETENTION_OPTIONS}
          value={String(retentionDays)}
          onValueChange={(value) => {
            if (value !== null) void setRetentionDays(Number(value));
          }}
        >
          <SelectTrigger id={retentionId} className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RETENTION_OPTIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={cleanupId}>自动清理过期截图</FieldLabel>
          <FieldDescription>开启后会永久删除超过期限的 DDU 截图。</FieldDescription>
        </FieldContent>
        <Switch id={cleanupId} checked={cleanup} onCheckedChange={(on) => void setCleanup(on)} />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={ocrId}>截图文字索引</FieldLabel>
          <FieldDescription>
            识别过文字的截图可在历史中按文字搜索；索引只保存在本机。
          </FieldDescription>
        </FieldContent>
        <Switch
          id={ocrId}
          checked={ocrIndex}
          disabled={disableOcrIndex.isPending}
          onCheckedChange={(on) => (on ? void setOcrIndex(true) : disableOcrIndex.mutate())}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>清空全部历史</FieldTitle>
        </FieldContent>
        <Button
          variant="destructive-muted"
          disabled={clearHistory.isPending}
          onClick={() => clearHistory.mutate()}
        >
          移到废纸篓
        </Button>
      </Field>
      {settingError && <FieldError>保存失败：{settingError.message}</FieldError>}
      {disableOcrIndex.error && (
        <FieldError>无法清除文字索引：{disableOcrIndex.error.message}</FieldError>
      )}
      {clearHistory.error && <FieldError>清空失败：{clearHistory.error.message}</FieldError>}
    </SettingCard>
  );
}
