import { HOLIDAYS } from './constants'
import type { BillResult, LifeConfig, TimeUnits, WeekendType } from '../types'

export const DAYS_PER_YEAR = 365.2425
const WEEKS_PER_YEAR = 365 / 7
const HOURS_PER_DAY = 24

const REST_DAYS_PER_WEEK: Record<WeekendType, number> = {
  DOUBLE: 2,
  BIG_SMALL: 1.5,
  SINGLE: 1,
  NONE: 0,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function timeToHours(value: string): number {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  return clamp(hours, 0, 23) + clamp(minutes, 0, 59) / 60
}

export function getDailySpanHours(start: string, end: string): number {
  const startHours = timeToHours(start)
  const endHours = timeToHours(end)
  const difference = endHours - startHours
  return difference < 0 ? difference + 24 : difference
}

export function formatTimeUnits(totalHours: number): TimeUnits {
  const safeHours = Math.max(0, Math.round(totalHours))
  const hoursPerYear = DAYS_PER_YEAR * 24
  const hoursPerMonth = hoursPerYear / 12
  const years = Math.floor(safeHours / hoursPerYear)
  const afterYears = safeHours - years * hoursPerYear
  const months = Math.floor(afterYears / hoursPerMonth)
  const afterMonths = afterYears - months * hoursPerMonth
  const days = Math.floor(afterMonths / 24)
  const hours = Math.round(afterMonths - days * 24)

  return {
    years,
    months,
    days,
    hours,
    totalMonths: Math.floor(safeHours / hoursPerMonth),
    totalDays: Math.floor(safeHours / 24),
    totalHours: safeHours,
  }
}

export function calculateLifeTimeBill(config: LifeConfig): BillResult {
  const lifetimeYears = Math.max(0, config.lifeExpectancy - config.currentAge)
  const yearsToRetirement = Math.max(0, Math.min(config.retireAge, config.lifeExpectancy) - config.currentAge)
  const yearsAfterRetirement = Math.max(0, config.lifeExpectancy - Math.max(config.retireAge, config.currentAge))
  const dailySpanHours = getDailySpanHours(config.workStart, config.workEnd)
  const dailyWorkHours = Math.max(0, dailySpanHours - clamp(config.breakHours, 0, 5))
  const annualWeekendDays = WEEKS_PER_YEAR * REST_DAYS_PER_WEEK[config.weekendType]
  const holidayDeduction = config.holidayMode === 'STANDARD'
    ? 13
    : HOLIDAYS.reduce((total, holiday) => total + Math.min(config.customHolidays[holiday.key], holiday.legalDays), 0)
  const annualWorkDays = clamp(DAYS_PER_YEAR - annualWeekendDays - holidayDeduction - config.annualLeave, 0, DAYS_PER_YEAR)
  const annualRestDays = DAYS_PER_YEAR - annualWorkDays
  const totalHours = lifetimeYears * DAYS_PER_YEAR * HOURS_PER_DAY
  const freeOnWorkday = Math.max(0, 24 - dailySpanHours - config.sleepHours - config.commuteHours - config.choresHours)
  const freeOnRestday = Math.max(0, 24 - config.sleepHours - config.choresHours)
  const netWorkHours = yearsToRetirement * annualWorkDays * dailyWorkHours
  const workHours = yearsToRetirement * annualWorkDays * dailySpanHours
  const preRetirementFreeHours = yearsToRetirement * (annualWorkDays * freeOnWorkday + annualRestDays * freeOnRestday)
  const postRetirementFreeHours = yearsAfterRetirement * DAYS_PER_YEAR * freeOnRestday
  const freeHours = preRetirementFreeHours + postRetirementFreeHours
  const maintenanceHours = Math.max(0, totalHours - workHours - freeHours)
  const percent = (value: number) => totalHours > 0 ? (value / totalHours) * 100 : 0

  return {
    lifetimeYears,
    yearsToRetirement,
    yearsAfterRetirement,
    dailySpanHours,
    dailyWorkHours,
    annualWorkDays,
    annualRestDays,
    holidayDeduction,
    totalHours,
    netWorkHours,
    workHours,
    preRetirementFreeHours,
    postRetirementFreeHours,
    freeHours,
    maintenanceHours,
    workPercentage: percent(workHours),
    freePercentage: percent(freeHours),
    maintenancePercentage: percent(maintenanceHours),
    workBill: formatTimeUnits(workHours),
    freeBill: formatTimeUnits(freeHours),
    postRetirementFreeBill: formatTimeUnits(postRetirementFreeHours),
    maintenanceBill: formatTimeUnits(maintenanceHours),
  }
}

export function formatFull(units: TimeUnits): string {
  return `${units.years}年 ${units.months}个月 ${units.days}天 ${units.hours}小时`
}
