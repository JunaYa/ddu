import { useSetting } from "@ddu/hooks";
import { pickDirectory } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldTitle } from "@ddu/ui/field";
import { useMutation } from "@tanstack/react-query";
import { SettingCard } from "../setting-card.tsx";

export function StorageSection() {
  const [path, setPath, status] = useSetting("screenshot_path");
  const choose = useMutation({
    mutationFn: async () => {
      const selected = await pickDirectory({ title: "选择目录" });
      if (selected) await setPath(selected);
    },
  });

  return (
    <SettingCard>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>截图保存路径</FieldTitle>
          {path && <FieldDescription className="break-all">已选择目录: {path}</FieldDescription>}
        </FieldContent>
        <Button variant="primary" disabled={choose.isPending} onClick={() => choose.mutate()}>
          {choose.isPending ? "选择中..." : "选择目录"}
        </Button>
      </Field>
      {choose.error && <FieldError>选择目录失败：{choose.error.message}</FieldError>}
      {status.error && <FieldError>保存失败：{status.error.message}</FieldError>}
    </SettingCard>
  );
}
