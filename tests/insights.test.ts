import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill } from '../src/lib/algorithm'
import { DEFAULT_CONFIG } from '../src/lib/constants'
import { buildInsights, describeDelta, workShareColor } from '../src/lib/insights'

describe('insights', () => {
  it('builds concrete metaphors from bill hours', () => {
    const result = calculateLifeTimeBill(DEFAULT_CONFIG)
    const lines = buildInsights(result)
    expect(lines.length).toBeGreaterThanOrEqual(7)
    expect(lines[0]?.value).toMatch(/电影/)
    expect(lines.some((line) => line.label.includes('退休前'))).toBe(true)
    expect(lines.some((line) => line.label.includes('退休后'))).toBe(true)
    expect(lines.some((line) => line.label.includes('全生命周期'))).toBe(true)
  })

  it('describes work percentage deltas', () => {
    expect(describeDelta(20, 30)).toContain('多')
    expect(describeDelta(30, 20)).toContain('少')
    expect(describeDelta(22.3, 22.35)).toContain('几乎一样')
  })

  it('maps higher work share to a deeper red', () => {
    expect(workShareColor(10)).not.toBe(workShareColor(35))
    const light = Number(workShareColor(10).match(/([\d.]+)%\)$/)?.[1])
    const deep = Number(workShareColor(35).match(/([\d.]+)%\)$/)?.[1])
    expect(deep).toBeLessThan(light)
  })
})
