export type WeekendType = 'DOUBLE' | 'BIG_SMALL' | 'SINGLE' | 'NONE'
export type HolidayMode = 'STANDARD' | 'CUSTOM'
export type HolidayKey = 'newYear' | 'spring' | 'qingming' | 'labor' | 'dragonBoat' | 'midAutumn' | 'national'

export interface LifeConfig {
  currentAge: number
  retireAge: number
  lifeExpectancy: number
  workStart: string
  workEnd: string
  breakHours: number
  weekendType: WeekendType
  holidayMode: HolidayMode
  annualLeave: number
  customHolidays: Record<HolidayKey, number>
  sleepHours: number
  commuteHours: number
  choresHours: number
}

export interface TimeUnits {
  years: number
  months: number
  days: number
  hours: number
  totalMonths: number
  totalDays: number
  totalHours: number
}

export interface BillResult {
  lifetimeYears: number
  yearsToRetirement: number
  yearsAfterRetirement: number
  dailySpanHours: number
  dailyWorkHours: number
  annualWorkDays: number
  annualRestDays: number
  holidayDeduction: number
  totalHours: number
  netWorkHours: number
  workHours: number
  preRetirementFreeHours: number
  postRetirementFreeHours: number
  freeHours: number
  maintenanceHours: number
  workPercentage: number
  freePercentage: number
  maintenancePercentage: number
  workBill: TimeUnits
  freeBill: TimeUnits
  postRetirementFreeBill: TimeUnits
  maintenanceBill: TimeUnits
}
