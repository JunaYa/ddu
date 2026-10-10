import {
  appVersion,
  type PermissionKind,
  permissionStatus,
  requestPermission,
  restartApp,
} from "@ddu/native";
import { Badge } from "@ddu/ui/badge";
import { Button } from "@ddu/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldTitle } from "@ddu/ui/field";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import logo from "./logo.png";

/** Re-read while the user flips switches in System Settings. */
const POLL_MS = 1000;

/** First-run guide: the permissions ddu needs, granted from one place (specs/07, M2). */
export function StartupWindow() {
  const version = useQuery({
    queryKey: ["app-version"],
    queryFn: appVersion,
    staleTime: Number.POSITIVE_INFINITY,
  });
  // React Query pauses the interval while the window is hidden (it hides
  // instead of closing), as the Vue page did with `document.hidden`.
  const status = useQuery({
    queryKey: ["permission-status"],
    queryFn: permissionStatus,
    refetchInterval: POLL_MS,
  });
  // macOS only applies a fresh Screen Recording grant to a relaunched
  // process, so once the user has been sent to System Settings we offer one.
  const [screenRecordingRequested, setScreenRecordingRequested] = useState(false);

  const request = useMutation({
    mutationFn: async (kind: PermissionKind) => {
      if (kind === "screenRecording") setScreenRecordingRequested(true);
      await requestPermission(kind);
    },
    onSettled: () => status.refetch(),
  });
  const restart = useMutation({ mutationFn: restartApp });

  const screenRecordingGranted = status.data?.screenRecording === "granted";

  return (
    <main className="flex h-screen flex-col overflow-y-auto bg-background/60 p-6">
      <img src={logo} alt="Ddu" className="mx-auto mb-2 size-14 drop-shadow-[0_0_1em_#747bff]" />
      <p className="text-center text-sm text-muted-foreground">Ddu 版本: V{version.data ?? ""}</p>

      {status.data && (
        <div className="mt-4 flex flex-col gap-3">
          <PermissionRow
            title="屏幕录制"
            badge={<Badge variant="destructive">必需</Badge>}
            description="截屏功能需要"
            granted={screenRecordingGranted}
            pending={request.isPending && request.variables === "screenRecording"}
            onRequest={() => request.mutate("screenRecording")}
          />
          {!screenRecordingGranted && screenRecordingRequested && (
            <div role="status" className="flex items-center justify-between gap-3">
              <span className="text-xs text-warning">在系统设置中开启后，重启应用生效</span>
              <Button
                variant="primary"
                disabled={restart.isPending}
                onClick={() => restart.mutate()}
              >
                重启应用
              </Button>
            </div>
          )}
          <PermissionRow
            title="辅助功能"
            badge={<Badge variant="secondary">推荐</Badge>}
            description="智能选区按 UI 元素捕捉需要"
            granted={status.data.accessibility === "granted"}
            pending={request.isPending && request.variables === "accessibility"}
            onRequest={() => request.mutate("accessibility")}
          />
        </div>
      )}

      {status.error && (
        <FieldError className="mt-4">无法读取权限状态：{status.error.message}</FieldError>
      )}
      {request.error && <FieldError className="mt-2">授权失败：{request.error.message}</FieldError>}
      {restart.error && <FieldError className="mt-2">重启失败：{restart.error.message}</FieldError>}
    </main>
  );
}

interface PermissionRowProps {
  title: string;
  badge: ReactNode;
  description: string;
  granted: boolean;
  pending: boolean;
  onRequest: () => void;
}

function PermissionRow({
  title,
  badge,
  description,
  granted,
  pending,
  onRequest,
}: PermissionRowProps) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>
          {title} {badge}
        </FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {granted ? (
        <Badge variant="success">已授权</Badge>
      ) : (
        <Button
          variant="primary"
          disabled={pending}
          aria-label={`授权${title}`}
          onClick={onRequest}
        >
          授权
        </Button>
      )}
    </Field>
  );
}
