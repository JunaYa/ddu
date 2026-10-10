const query = "(prefers-color-scheme: dark)";

/**
 * Mirror the macOS appearance onto `<html class="dark">`, the switch the
 * design tokens key off (specs/99 D9). Returns a function that stops following.
 */
export function followSystemTheme(root: HTMLElement = document.documentElement): () => void {
  const media = window.matchMedia(query);
  const apply = () => root.classList.toggle("dark", media.matches);
  apply();
  media.addEventListener("change", apply);
  return () => media.removeEventListener("change", apply);
}
