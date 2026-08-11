import { describe, expect, it } from 'vitest'
import { shouldAutoHidePreview } from './preview-lifecycle'

describe('shouldAutoHidePreview', () => {
  it('waits while the user is hovering or editing', () => {
    expect(shouldAutoHidePreview({ hovered: true, editing: false })).toBe(false)
    expect(shouldAutoHidePreview({ hovered: false, editing: true })).toBe(false)
  })

  it('hides an untouched preview after its timeout', () => {
    expect(shouldAutoHidePreview({ hovered: false, editing: false })).toBe(true)
  })
})
