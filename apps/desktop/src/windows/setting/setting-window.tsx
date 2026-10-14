import { call, on } from "@ddu/native";
import { useEffect, useRef } from "react";
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
  const permissionsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const reveal = async () => {
      if (disposed) return;
      if (await call("take_permission_navigation")) {
        if (disposed) return;
        permissionsRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
        permissionsRef.current?.focus({ preventScroll: true });
      }
    };
    void on("settings-permissions", () => {
      void reveal();
    }).then((stop) => {
      if (disposed) {
        stop();
        return;
      }
      unlisten = stop;
      void reveal();
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);
  return (
    <main className="flex h-screen flex-col gap-4 overflow-y-auto bg-background/60 p-4">
      <GeneralSection />
      <section
        ref={permissionsRef}
        tabIndex={-1}
        aria-label="权限管理"
        className="shrink-0 scroll-mt-4 rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
      >
        <PermissionsSection />
      </section>
      <StorageSection />
      <CaptureSection />
      <RecordingSection />
      <ShortcutsSection />
      <HistorySection />
      <DiagnosticsSection />
    </main>
  );
}
