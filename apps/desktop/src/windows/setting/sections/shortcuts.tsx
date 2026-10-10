import { useSetting } from "@ddu/hooks";
import { applyShortcuts, type SettingKey, settingsSchema } from "@ddu/native";
import { Button } from "@ddu/ui/button";
import { Field, FieldError, FieldLabel } from "@ddu/ui/field";
import { Kbd } from "@ddu/ui/kbd";
import { RotateCcw } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { SettingCard } from "../setting-card.tsx";
import { comboFromKeyEvent } from "../shortcut-combo.ts";

type HotkeyKey = Extract<SettingKey, `hotkey_${string}`>;

const SHORTCUTS: ReadonlyArray<{ key: HotkeyKey; label: string }> = [
  { key: "hotkey_fullscreen", label: "Full Screen Capture" },
  { key: "hotkey_region", label: "Region Capture" },
  { key: "hotkey_window", label: "Window Capture" },
  { key: "hotkey_text", label: "Capture Text (OCR)" },
];

export function ShortcutsSection() {
  return (
    <SettingCard title="Shortcuts">
      {SHORTCUTS.map(({ key, label }) => (
        <ShortcutRow key={key} settingKey={key} label={label} />
      ))}
    </SettingCard>
  );
}

function ShortcutRow({ settingKey, label }: { settingKey: HotkeyKey; label: string }) {
  const [combo, setCombo, status] = useSetting(settingKey);
  const [recording, setRecording] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  /** Store the combo, then have Rust re-register; on failure Rust rolls back and keeps the old set. */
  async function save(next: string) {
    await setCombo(next);
    try {
      await applyShortcuts();
      setApplyError(null);
    } catch (error) {
      // Keep the attempted value visible so the user can fix it.
      setApplyError(error instanceof Error ? error.message : String(error));
    }
  }

  // The key listeners outlive renders; they always call the latest `save`.
  const commit = useEffectEvent((next: string) => void save(next));

  useEffect(() => {
    if (!recording) return;
    let latest: string | null = null;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const next = comboFromKeyEvent(event);
      if (next) {
        latest = next;
        setPressed(next);
      }
    };
    const onKeyUp = () => {
      if (!latest) return;
      setRecording(false);
      setPressed(null);
      commit(latest);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [recording]);

  const error = applyError ?? status.error?.message ?? null;

  return (
    <>
      <Field orientation="horizontal">
        <FieldLabel>{label}</FieldLabel>
        <Button
          variant="outline"
          aria-label={`${label}: ${recording ? "recording" : combo}`}
          onClick={() => setRecording(true)}
        >
          {recording ? (pressed ?? "Press keys...") : <Kbd>{combo}</Kbd>}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Reset to default"
          aria-label={`Reset ${label} to default`}
          onClick={() => void save(settingsSchema[settingKey].default)}
        >
          <RotateCcw />
        </Button>
      </Field>
      {error && <FieldError className="text-right">{error}</FieldError>}
    </>
  );
}
