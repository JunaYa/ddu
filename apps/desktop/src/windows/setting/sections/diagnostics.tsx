import { getDiagnosticsBundle } from "@ddu/native";
import { diagnosticStatusLabel, type DiagnosticTone } from "@ddu/utils";
import { Badge } from "@ddu/ui/badge";
import { Button } from "@ddu/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldTitle } from "@ddu/ui/field";
import { useMutation } from "@tanstack/react-query";
import { SettingCard } from "../setting-card.tsx";

const TONE_VARIANT = {
  success: "success",
  warning: "warning",
  neutral: "secondary",
} as const satisfies Record<DiagnosticTone, string>;

/** Local-only capability and permission check, run on demand. */
export function DiagnosticsSection() {
  const check = useMutation({ mutationFn: getDiagnosticsBundle });
  const bundle = check.data;

  return (
    <SettingCard>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>本机诊断</FieldTitle>
          <FieldDescription>
            仅在此设备显示，用于检查截图能力与所需权限；不会上传任何信息。
          </FieldDescription>
        </FieldContent>
        <Button variant="primary" disabled={check.isPending} onClick={() => check.mutate()}>
          {check.isPending ? "检查中…" : "运行检查"}
        </Button>
      </Field>
      {bundle && (
        <>
          <p className="text-xs text-muted-foreground">
            DDU {bundle.app_version} · {bundle.os} {bundle.os_version} · {bundle.arch}
          </p>
          <ul className="flex flex-col gap-2">
            {[...bundle.permissions, ...bundle.capabilities].map((item, index) => {
              const { label, tone } = diagnosticStatusLabel(item.status);
              return (
                <li
                  key={`${index < bundle.permissions.length ? "permission" : "capability"}:${item.key}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm">{item.key}</div>
                    {item.reason && (
                      <div className="text-xs text-muted-foreground">{item.reason}</div>
                    )}
                  </div>
                  <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {check.error && <FieldError>无法读取本机诊断信息。</FieldError>}
    </SettingCard>
  );
}
