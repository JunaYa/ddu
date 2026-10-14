import { permissionStatus, requestPermission } from "@ddu/native";
import { Badge } from "@ddu/ui/badge";
import { Button } from "@ddu/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldTitle } from "@ddu/ui/field";
import { useMutation, useQuery } from "@tanstack/react-query";
import { permissions, permissionStateLabel } from "../../permission/model.ts";
import { SettingCard } from "../setting-card.tsx";

export function PermissionsSection() {
  const status = useQuery({
    queryKey: ["permission-status"],
    queryFn: permissionStatus,
    refetchInterval: 1000,
    refetchOnWindowFocus: "always",
    retry: false,
  });
  const manage = useMutation({ mutationFn: requestPermission, onSettled: () => status.refetch() });
  return (
    <SettingCard title="权限管理">
      <p className="text-xs text-muted-foreground">授权与撤销均由你在 macOS 系统设置中管理。</p>
      {permissions.map(({ kind, title, description }) => (
        <Field orientation="horizontal" key={kind}>
          <FieldContent>
            <FieldTitle>
              {title}{" "}
              <Badge variant={status.data?.[kind] === "granted" ? "success" : "secondary"}>
                {status.isPending ? "检查中…" : permissionStateLabel(status.data?.[kind])}
              </Badge>
            </FieldTitle>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
          <Button
            aria-label={`管理${title}权限`}
            disabled={manage.isPending}
            onClick={() => manage.mutate(kind)}
          >
            {status.data?.[kind] === "granted" ? "管理" : "授权"}
          </Button>
        </Field>
      ))}
      {status.error && <FieldError>无法读取权限状态：{status.error.message}</FieldError>}
      {manage.error && <FieldError>无法打开授权引导：{manage.error.message}</FieldError>}
    </SettingCard>
  );
}
