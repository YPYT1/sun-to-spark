import { describe, expect, it } from 'vitest'
import { calculateLifeTimeBill, getDailySpanHours } from '../src/lib/algorithm'
import { DEFAULT_CONFIG } from '../src/lib/constants'

describe('life time bill', () => {
  it('matches the documented default scenario', () => {
    const result = calculateLifeTimeBill(DEFAULT_CONFIG)
    expect(result.annualWorkDays).toBeCloseTo(269.0282, 3)
    expect(result.netWorkHours).toBeCloseTo(80708.47, 1)
    expect(result.workHours).toBeCloseTo(107611.29, 1)
  })

  it('handles overnight shifts', () => {
    expect(getDailySpanHours('22:00', '06:00')).toBe(8)
  })

  it('caps custom holiday deduction at legal leave days', () => {
    const result = calculateLifeTimeBill({
      ...DEFAULT_CONFIG,
      holidayMode: 'CUSTOM',
      customHolidays: { newYear: 15, spring: 15, qingming: 15, labor: 15, dragonBoat: 15, midAutumn: 15, national: 15 },
    })
    expect(result.holidayDeduction).toBe(13)
  })

  it('never emits negative time when retirement is in the past', () => {
    const result = calculateLifeTimeBill({ ...DEFAULT_CONFIG, currentAge: 70, retireAge: 65 })
    expect(result.workHours).toBe(0)
    expect(result.totalHours).toBeGreaterThan(0)
    expect(result.freeHours).toBeGreaterThan(0)
  })

  it('uses the complete remaining lifetime and counts the full workday as occupied time', () => {
    const result = calculateLifeTimeBill({
      ...DEFAULT_CONFIG,
      currentAge: 24,
      retireAge: 65,
      lifeExpectancy: 75,
      workStart: '10:00',
      workEnd: '20:00',
      breakHours: 2.5,
      weekendType: 'BIG_SMALL',
      annualLeave: 0,
    })

    expect(result.totalHours).toBeCloseTo(51 * 365.2425 * 24, 2)
    expect(result.workHours).toBeCloseTo(41 * result.annualWorkDays * 10, 2)
    expect(result.postRetirementFreeHours).toBeCloseTo(10 * 365.2425 * 15, 2)
    expect(result.freeHours).toBeCloseTo(result.preRetirementFreeHours + result.postRetirementFreeHours, 2)
    expect(result.preRetirementFreeBill.totalHours).toBe(Math.round(result.preRetirementFreeHours))
    expect(result.workPercentage + result.maintenancePercentage + result.freePercentage).toBeCloseTo(100, 8)
  })

  it('changes the lifetime bill when life expectancy changes', () => {
    const age75 = calculateLifeTimeBill({ ...DEFAULT_CONFIG, lifeExpectancy: 75 })
    const age95 = calculateLifeTimeBill({ ...DEFAULT_CONFIG, lifeExpectancy: 95 })
    expect(age95.totalHours).toBeGreaterThan(age75.totalHours)
    expect(age95.freeHours).toBeGreaterThan(age75.freeHours)
  })
})
