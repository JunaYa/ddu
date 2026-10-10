import { createQueryClient } from "@ddu/hooks";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, StrictMode, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { WindowErrorBoundary } from "./error-boundary.tsx";
import { followSystemTheme } from "./system-theme.ts";

/** The providers every React window renders inside. */
export function WindowShell({ children }: { children: ReactNode }) {
  // One cache for the window's lifetime; never recreated on re-render.
  const [queryClient] = useState(createQueryClient);
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <WindowErrorBoundary>
          {/* Settings load over local IPC in a few ms; no spinner flash. */}
          <Suspense fallback={null}>{children}</Suspense>
        </WindowErrorBoundary>
      </QueryClientProvider>
    </StrictMode>
  );
}

/** Entry point of a React window: follow the system theme and render into `#root`. */
export function mountWindow(window: ReactNode): void {
  const container = document.getElementById("root");
  if (!container) throw new Error("mountWindow: #root element missing from the window's HTML");
  followSystemTheme();
  createRoot(container).render(<WindowShell>{window}</WindowShell>);
}
