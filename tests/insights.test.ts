import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill } from '../src/lib/algorithm'
import { DEFAULT_CONFIG } from '../src/lib/constants'
import { buildInsights, describeDelta } from '../src/lib/insights'

describe('insights', () => {
  it('builds concrete metaphors from bill hours', () => {
    const result = calculateLifeTimeBill(DEFAULT_CONFIG)
    const lines = buildInsights(result)
    expect(lines).toHaveLength(3)
    expect(lines[0]?.value).toMatch(/电影/)
    expect(lines[1]?.value).toMatch(/周末/)
  })

  it('describes work percentage deltas', () => {
    expect(describeDelta(20, 30)).toContain('多')
    expect(describeDelta(30, 20)).toContain('少')
    expect(describeDelta(22.3, 22.35)).toContain('几乎一样')
  })
})
