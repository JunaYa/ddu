import { cancelCapture } from "@ddu/native";

/**
 * Escape cancels the capture from anywhere, independently of React: the
 * overlay is borderless and above the menu bar, so even if the React tree
 * fails the user must never be stuck behind the frozen screen.
 */
export function installEscapeToCancel(target: Window = window): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    void cancelCapture();
  };
  target.addEventListener("keydown", onKeyDown);
  return () => target.removeEventListener("keydown", onKeyDown);
}
