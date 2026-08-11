import { describe, expect, it } from 'vitest'
import { diagnosticStatusLabel } from './diagnostics-summary'

describe('diagnosticStatusLabel', () => {
  it('makes unavailable capabilities actionable', () => {
    expect(diagnosticStatusLabel('unavailable')).toEqual({ label: '需要处理', tone: 'warning' })
  })

  it('marks available capabilities as ready', () => {
    expect(diagnosticStatusLabel('available')).toEqual({ label: '可用', tone: 'success' })
  })
})
