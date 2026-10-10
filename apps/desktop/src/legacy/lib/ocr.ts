export interface OcrBlock {
  text: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

export interface OcrResult {
  text: string
  language: string
  engine: string
  blocks: OcrBlock[]
}

/** Image-pixel area passed to `perform_ocr` to recognize only part of a capture. */
export interface OcrRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface OcrLine {
  text: string
  /** Where the line sits in the image; absent for engines without boxes. */
  box?: OcrBlock
}

export function ocrLines(result: OcrResult): OcrLine[] {
  if (result.blocks.length > 0)
    return result.blocks.map(box => ({ text: box.text, box }))
  return result.text
    .split('\n')
    .map(text => text.trim())
    .filter(Boolean)
    .map(text => ({ text }))
}

const CJK = /[　-〿぀-ヿ㐀-鿿豈-﫿＀-￯]/

/**
 * Join recognized lines either keeping line breaks or as one paragraph.
 * Merging inserts a space between Latin words but none between CJK
 * characters, which never take one.
 */
export function joinOcrLines(lines: string[], merge: boolean): string {
  if (!merge) return lines.join('\n')
  return lines.reduce((acc, line) => {
    if (!acc) return line
    const needsSpace = !(CJK.test(acc[acc.length - 1]) && CJK.test(line[0]))
    return needsSpace ? `${acc} ${line}` : acc + line
  }, '')
}
