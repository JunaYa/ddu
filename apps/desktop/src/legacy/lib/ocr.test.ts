import { describe, expect, it } from 'vite-plus/test'
import { joinOcrLines, ocrLines } from './ocr'

describe('ocrLines', () => {
  it('uses boxed blocks when the engine reports them', () => {
    const box = { text: 'hello', x: 1, y: 2, width: 3, height: 4, confidence: 0.9 }
    expect(ocrLines({ text: 'hello', language: 'auto', engine: 'oar-ocr', blocks: [box] }))
      .toEqual([{ text: 'hello', box }])
  })

  it('falls back to plain text lines without boxes', () => {
    expect(ocrLines({ text: ' a \n\nb\n', language: 'auto', engine: 'system', blocks: [] }))
      .toEqual([{ text: 'a' }, { text: 'b' }])
  })
})

describe('joinOcrLines', () => {
  it('keeps line breaks unless merging', () => {
    expect(joinOcrLines(['a', 'b'], false)).toBe('a\nb')
  })

  it('merges Latin lines with spaces and CJK lines without', () => {
    expect(joinOcrLines(['connection', 'refused'], true)).toBe('connection refused')
    expect(joinOcrLines(['截图工具', '测试'], true)).toBe('截图工具测试')
    expect(joinOcrLines(['错误', 'Error'], true)).toBe('错误 Error')
  })
})
