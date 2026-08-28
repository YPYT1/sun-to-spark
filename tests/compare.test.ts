import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill } from '../src/lib/algorithm'
import { COMPARE_PRESETS, DEFAULT_CONFIG } from '../src/lib/constants'

describe('compare presets', () => {
  it('includes extra lifestyle scenarios beyond hero presets', () => {
    expect(COMPARE_PRESETS.length).toBeGreaterThanOrEqual(7)
  })

  it('uses the worker-first comparison labels', () => {
    const names = COMPARE_PRESETS.map((preset) => preset.name)
    expect(names).toContain('996打工人')
    expect(names).toContain('标准打工人')
    expect(names).not.toContain('大厂 996')
    expect(names).not.toContain('007 福报')
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
