import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill } from '../src/lib/algorithm'
import { matchCompareTier } from '../src/lib/compare'
import { COMPARE_PRESETS, DEFAULT_CONFIG } from '../src/lib/constants'

describe('compare presets', () => {
  it('includes extra lifestyle scenarios beyond hero presets', () => {
    expect(COMPARE_PRESETS).toHaveLength(7)
  })

  it('uses the worker-first comparison labels', () => {
    const names = COMPARE_PRESETS.map((preset) => preset.name)
    expect(names).toContain('996打工人')
    expect(names).toContain('标准打工人')
    expect(names).toContain('顶级牛马')
    expect(names).not.toContain('自由职业')
    expect(names).not.toContain('准退休作息')
    expect(names).not.toContain('大厂 996')
    expect(names).not.toContain('007 福报')
  })

  it('matches the current tier by schedule rules instead of nearest work percentage', () => {
    const config = (patch: Partial<typeof DEFAULT_CONFIG>) => ({ ...DEFAULT_CONFIG, ...patch })

    expect(matchCompareTier(config({ weekendType: 'SINGLE', workStart: '10:00', workEnd: '22:00' }))).toBe('996打工人')
    expect(matchCompareTier(config({ weekendType: 'NONE' }))).toBe('顶级牛马')
    expect(matchCompareTier(config({ weekendType: 'BIG_SMALL', commuteHours: 2.5 }))).toBe('大小休打工人')
    expect(matchCompareTier(config({ weekendType: 'BIG_SMALL', commuteHours: 3.5 }))).toBe('北漂通勤党')
    expect(matchCompareTier(config({ weekendType: 'DOUBLE', workStart: '09:00', workEnd: '17:00' }))).toBe('体制内 / 外企')
    expect(matchCompareTier(config({ weekendType: 'DOUBLE', workStart: '09:00', workEnd: '18:00' }))).toBe('标准打工人')
    expect(matchCompareTier(config({ weekendType: 'TRIPLE', workStart: '10:00', workEnd: '17:00' }))).toBe('北欧福利')
  })

  it('sorts by work percentage descending', () => {
    const rows = COMPARE_PRESETS
      .map((preset) => calculateLifeTimeBill({ ...DEFAULT_CONFIG, ...preset.values }).workPercentage)
      .sort((a, b) => b - a)
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1]).toBeGreaterThanOrEqual(rows[i]!)
    }
  })
})
