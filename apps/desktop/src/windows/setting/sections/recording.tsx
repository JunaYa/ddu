import { call } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@ddu/ui/field";
import { Switch } from "@ddu/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { SettingCard } from "../setting-card.tsx";

export function RecordingSection() {
  const id = useId();
  const client = useQueryClient();
  const [systemAudio, setSystemAudio] = useState(true);
  const [microphone, setMicrophone] = useState(false);
  const [region, setRegion] = useState(false);
  const [saved, setSaved] = useState("");
  const recording = useQuery({
    queryKey: ["recording"],
    queryFn: () => call("is_recording"),
    refetchInterval: 1000,
  });
  const scroll = useQuery({
    queryKey: ["scroll"],
    queryFn: () => call("scroll_status"),
    refetchInterval: 1000,
  });
  const action = useMutation({
    mutationFn: async (kind: "start" | "stop" | "finish" | "cancel") => {
      if (kind === "start") {
        setSaved("");
        await call("start_recording", {
          path: "images",
          config: {
            mode: region ? "region" : "fullscreen",
            include_cursor: false,
            include_audio: microphone,
            system_audio: systemAudio,
          },
        });
      } else if (kind === "stop") {
        const result = await call("stop_recording");
        setSaved(result.file_path);
      } else if (kind === "finish") await call("scroll_finish");
      else await call("scroll_cancel");
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["recording"] });
      void client.invalidateQueries({ queryKey: ["scroll"] });
    },
  });
  const disabled = action.isPending || recording.data === true;
  return (
    <SettingCard title="录屏与滚动截图">
      <FieldDescription>
        录屏保存为 MOV。开始后可收起设置窗口，通过托盘停止并保存。
      </FieldDescription>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={`${id}-system`}>系统声音</FieldLabel>
        <Switch
          id={`${id}-system`}
          checked={systemAudio}
          onCheckedChange={setSystemAudio}
          disabled={disabled}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={`${id}-mic`}>麦克风</FieldLabel>
        <Switch
          id={`${id}-mic`}
          checked={microphone}
          onCheckedChange={setMicrophone}
          disabled={disabled}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={`${id}-region`}>选择录制区域</FieldLabel>
        <Switch
          id={`${id}-region`}
          checked={region}
          onCheckedChange={setRegion}
          disabled={disabled}
        />
      </Field>
      <Button
        variant="primary"
        disabled={action.isPending || recording.isPending || !!recording.error}
        onClick={() => action.mutate(recording.data ? "stop" : "start")}
      >
        {action.isPending ? "处理中…" : recording.data ? "停止录屏并保存" : "开始录屏"}
      </Button>
      {recording.data && (
        <p role="status" className="text-sm">
          录屏会话进行中；区域模式请完成系统选区。可随时从托盘停止。
        </p>
      )}
      {saved && (
        <p role="status" className="break-all text-sm">
          已保存：{saved}
        </p>
      )}
      <FieldDescription>
        滚动截图：从托盘开始，选取内容区域后缓慢向下滚动，每次停稳。避开固定标题栏，每次保留至少 1/4
        重叠；从托盘完成或取消。最多 5 分钟。
      </FieldDescription>
      {scroll.data?.active && (
        <>
          <p role="status" className="text-sm">
            {scroll.data.message}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              disabled={action.isPending}
              onClick={() => action.mutate("finish")}
            >
              完成长图
            </Button>
            <Button disabled={action.isPending} onClick={() => action.mutate("cancel")}>
              取消长图
            </Button>
          </div>
        </>
      )}
      {(action.error || recording.error || scroll.error) && (
        <FieldError>{(action.error || recording.error || scroll.error)?.message}</FieldError>
      )}
    </SettingCard>
  );
}
