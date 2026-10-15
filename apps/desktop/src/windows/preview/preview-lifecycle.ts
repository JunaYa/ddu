export interface PreviewActivity {
  hovered: boolean;
  editing: boolean;
  /** A preview action (e.g. OCR) is still running. */
  busy?: boolean;
}

export function shouldAutoHidePreview({
  hovered,
  editing,
  busy = false,
}: PreviewActivity): boolean {
  return !hovered && !editing && !busy;
}
