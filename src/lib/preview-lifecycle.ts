export interface PreviewActivity {
  hovered: boolean
  editing: boolean
}

export function shouldAutoHidePreview({ hovered, editing }: PreviewActivity): boolean {
  return !hovered && !editing
}
