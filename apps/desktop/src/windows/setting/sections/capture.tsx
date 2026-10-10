import { useSetting } from "@ddu/hooks";
import { settingsSchema } from "@ddu/native";
import { Field, FieldContent, FieldError, FieldLabel, FieldTitle } from "@ddu/ui/field";
import { Input } from "@ddu/ui/input";
import { Switch } from "@ddu/ui/switch";
import { Toggle, ToggleGroup } from "@ddu/ui/toggle-group";
import { useEffect, useId, useState } from "react";
import { SettingCard } from "../setting-card.tsx";

const DELAY_OPTIONS = [0, 3, 5, 10] as const;

export function CaptureSection() {
  const cursorId = useId();
  const namingId = useId();
  const [delay, setDelay, delayStatus] = useSetting("capture_delay");
  const [includeCursor, setIncludeCursor, cursorStatus] = useSetting("include_cursor");
  const [stored, setTemplate, templateStatus] = useSetting("naming_template");
  // An empty value showed the default before the migration; keep that.
  const template = stored || settingsSchema.naming_template.default;
  // Edited locally and saved on blur, as before the migration. Changes made
  // elsewhere replace the draft unless the user is editing it.
  const [draft, setDraft] = useState(template);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(template);
  }, [template, editing]);
  const error = delayStatus.error ?? cursorStatus.error ?? templateStatus.error;

  return (
    <SettingCard title="Capture">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Default Delay</FieldTitle>
        </FieldContent>
        <ToggleGroup
          aria-label="Default Delay"
          value={[String(delay)]}
          onValueChange={(next) => {
            // Single choice: ignore clicks that would deselect the current delay.
            const picked = next[0];
            if (picked !== undefined) void setDelay(Number(picked));
          }}
        >
          {DELAY_OPTIONS.map((seconds) => (
            <Toggle key={seconds} value={String(seconds)}>
              {seconds === 0 ? "None" : `${seconds}s`}
            </Toggle>
          ))}
        </ToggleGroup>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={cursorId}>Include Cursor</FieldLabel>
        <Switch
          id={cursorId}
          checked={includeCursor}
          onCheckedChange={(on) => void setIncludeCursor(on)}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={namingId}>File Naming</FieldLabel>
        <Input
          id={namingId}
          className="w-48"
          placeholder="{date}_{time}_{mode}"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            if (draft !== template) void setTemplate(draft);
          }}
        />
      </Field>
      {error && <FieldError>保存失败：{error.message}</FieldError>}
    </SettingCard>
  );
}
