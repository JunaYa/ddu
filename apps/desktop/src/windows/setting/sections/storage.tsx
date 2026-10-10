import { useSetting } from "@ddu/hooks";
import { pickDirectory } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@ddu/ui/field";
import { useState } from "react";
import { SettingCard } from "../setting-card.tsx";

export function StorageSection() {
  const [path, setPath, status] = useSetting("screenshot_path");
  const [picking, setPicking] = useState(false);

  async function choose() {
    setPicking(true);
    try {
      const selected = await pickDirectory({ title: "选择目录" });
      if (selected) await setPath(selected);
    } finally {
      setPicking(false);
    }
  }

  return (
    <SettingCard>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>截图保存路径</FieldLabel>
          {path && <FieldDescription className="break-all">已选择目录: {path}</FieldDescription>}
        </FieldContent>
        <Button variant="primary" disabled={picking} onClick={choose}>
          {picking ? "选择中..." : "选择目录"}
        </Button>
      </Field>
      {status.error && <FieldError>保存失败：{status.error.message}</FieldError>}
    </SettingCard>
  );
}
