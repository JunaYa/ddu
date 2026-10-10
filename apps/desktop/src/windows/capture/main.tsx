import "./capture.css";
import { cancelCapture } from "@ddu/native";
import { createRoot } from "react-dom/client";
import { WindowErrorBoundary } from "../../shared/error-boundary.tsx";
import { CaptureWindow } from "./capture-window.tsx";
import { installEscapeToCancel } from "./escape-to-cancel.ts";

// A lean shell instead of mountWindow (specs/99 D14): no data layer and no
// StrictMode double effects (each `get_session` encodes the whole screen).
installEscapeToCancel();
const container = document.getElementById("root");
if (!container) throw new Error("capture.html is missing #root");
createRoot(container).render(
  // A render failure cancels the capture rather than leaving the user stuck.
  <WindowErrorBoundary onError={() => void cancelCapture()}>
    <CaptureWindow />
  </WindowErrorBoundary>,
);
