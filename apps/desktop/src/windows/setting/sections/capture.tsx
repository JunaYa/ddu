import { useSetting } from "@ddu/hooks";
import { Field, FieldError, FieldLabel } from "@ddu/ui/field";
import { Input } from "@ddu/ui/input";
import { Switch } from "@ddu/ui/switch";
import { Toggle, ToggleGroup } from "@ddu/ui/toggle-group";
import { useId, useState } from "react";
import { SettingCard } from "../setting-card.tsx";

const DELAY_OPTIONS = [0, 3, 5, 10] as const;

export function CaptureSection() {
  const cursorId = useId();
  const namingId = useId();
  const [delay, setDelay, delayStatus] = useSetting("capture_delay");
  const [includeCursor, setIncludeCursor, cursorStatus] = useSetting("include_cursor");
  const [template, setTemplate, templateStatus] = useSetting("naming_template");
  // Edited locally and saved on blur, as before the migration.
  const [draft, setDraft] = useState(template);
  const error = delayStatus.error ?? cursorStatus.error ?? templateStatus.error;

  return (
    <SettingCard title="Capture">
      <Field orientation="horizontal">
        <FieldLabel>Default Delay</FieldLabel>
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
          onBlur={() => {
            if (draft !== template) void setTemplate(draft);
          }}
        />
      </Field>
      {error && <FieldError>保存失败：{error.message}</FieldError>}
    </SettingCard>
  );
}
