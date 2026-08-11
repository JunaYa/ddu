export type DiagnosticTone = 'success' | 'warning' | 'neutral'

export function diagnosticStatusLabel(status: string): { label: string, tone: DiagnosticTone } {
  if (status === 'available')
    return { label: '可用', tone: 'success' }
  if (status === 'unavailable' || status === 'limited')
    return { label: '需要处理', tone: 'warning' }
  return { label: '未知', tone: 'neutral' }
}
