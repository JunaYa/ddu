import { RecordingSection } from "./sections/recording.tsx";
import { PermissionsSection } from "./sections/permissions.tsx";
import { CaptureSection } from "./sections/capture.tsx";
import { DiagnosticsSection } from "./sections/diagnostics.tsx";
import { GeneralSection } from "./sections/general.tsx";
import { HistorySection } from "./sections/history.tsx";
import { ShortcutsSection } from "./sections/shortcuts.tsx";
import { StorageSection } from "./sections/storage.tsx";

/** The settings window: one card per section, in the pre-migration order (specs/13 § 5). */
export function SettingWindow() {
  return (
    <main className="flex h-screen flex-col gap-4 overflow-y-auto bg-background/60 p-4">
      <GeneralSection />
      <PermissionsSection />
      <StorageSection />
      <CaptureSection />
      <RecordingSection />
      <ShortcutsSection />
      <HistorySection />
      <DiagnosticsSection />
    </main>
  );
}
