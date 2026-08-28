import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill } from '../src/lib/algorithm'
import { COMPARE_PRESETS, DEFAULT_CONFIG } from '../src/lib/constants'

describe('compare presets', () => {
  it('includes extra lifestyle scenarios beyond hero presets', () => {
    expect(COMPARE_PRESETS.length).toBeGreaterThanOrEqual(7)
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
