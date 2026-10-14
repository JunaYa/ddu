import {
  closePermissionHelper,
  dragPermissionApp,
  openPermissionSettings,
  permissionAppPath,
  permissionStatus,
  restartApp,
} from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp, Hand, Settings, X } from "lucide-react";
import logo from "../startup/logo.png";
import { permissions, permissionStateLabel } from "./model.ts";

export function PermissionWindow() {
  const permission = permissions.find(
    (p) => p.kind === new URLSearchParams(window.location.search).get("kind"),
  );
  const kind = permission?.kind;
  const status = useQuery({
    queryKey: ["permission-status"],
    queryFn: permissionStatus,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
    retry: false,
  });
  const bundle = useQuery({
    queryKey: ["permission-app-path"],
    queryFn: permissionAppPath,
    retry: false,
    enabled: !!kind && kind !== "microphone",
  });
  const action = useMutation({ mutationFn: (fn: () => Promise<void>) => fn() });
  const granted = !!kind && status.data?.[kind] === "granted";
  return (
    <main className="flex h-screen flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-background p-4 text-foreground">
      <header className="flex items-center gap-2">
        <div
          data-tauri-drag-region
          className="flex flex-1 items-center gap-2 text-sm font-semibold"
        >
          <ArrowUp aria-hidden className="size-5 shrink-0 text-primary" />
          {granted
            ? `${permission?.title}已授权`
            : kind === "microphone"
              ? "在系统设置中允许 DDU 使用麦克风"
              : `将 DDU 拖入上方的「${permission?.title ?? "权限"}」列表`}
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="打开系统设置"
          disabled={!kind || action.isPending}
          onClick={() => kind && action.mutate(() => openPermissionSettings(kind))}
        >
          <Settings className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="关闭授权引导"
          onClick={() => action.mutate(closePermissionHelper)}
        >
          <X className="size-4" />
        </Button>
      </header>
      {kind !== "microphone" && (
        <Button
          variant="outline"
          type="button"
          draggable={!!bundle.data}
          disabled={!bundle.data || action.isPending}
          aria-label="拖拽 DDU 到系统权限列表"
          title={bundle.data}
          onDragStart={(event) => {
            event.preventDefault();
            action.mutate(dragPermissionApp);
          }}
          className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 text-left disabled:opacity-50 enabled:cursor-grab"
        >
          <img src={logo} draggable={false} alt="" className="size-10" />
          <span className="flex-1 font-semibold">DDU</span>
          <Hand aria-hidden className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">拖拽</span>
        </Button>
      )}
      <div className="text-xs text-muted-foreground" aria-live="polite">
        {kind === "microphone"
          ? "请在系统弹窗中允许访问，然后在麦克风列表中管理 DDU。麦克风不支持拖拽添加。"
          : "拖入后打开 DDU 旁的开关；也可以使用系统列表的「+」按钮添加应用。"}
        {kind && <span className="ml-2">{permissionStateLabel(status.data?.[kind])}</span>}
      </div>
      {kind === "screenRecording" && !granted && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          已打开权限但状态未更新？重启 DDU 后生效。
          <Button size="sm" onClick={() => action.mutate(restartApp)}>
            重启应用
          </Button>
        </div>
      )}
      {(bundle.error || status.error || action.error || !kind) && (
        <p role="alert" className="text-xs text-destructive">
          {action.error?.message ??
            bundle.error?.message ??
            status.error?.message ??
            "未知的权限类型，请从设置页重新打开。"}
        </p>
      )}
    </main>
  );
}
