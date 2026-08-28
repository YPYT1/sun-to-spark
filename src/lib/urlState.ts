import { DEFAULT_CONFIG, HOLIDAYS } from './constants'
import type { HolidayMode, LifeConfig, WeekendType } from '../types'

const numericKeys: Array<keyof Pick<LifeConfig, 'currentAge' | 'retireAge' | 'lifeExpectancy' | 'breakHours' | 'annualLeave' | 'sleepHours' | 'commuteHours' | 'choresHours'>> = [
  'currentAge', 'retireAge', 'lifeExpectancy', 'breakHours', 'annualLeave', 'sleepHours', 'commuteHours', 'choresHours',
]

export function readConfigFromUrl(search: string): LifeConfig {
  const params = new URLSearchParams(search)
  const config: LifeConfig = structuredClone(DEFAULT_CONFIG)

  numericKeys.forEach((key) => {
    const value = params.get(key)
    if (value !== null && Number.isFinite(Number(value))) config[key] = Number(value)
  })
  const weekend = params.get('weekendType') as WeekendType | null
  if (weekend && ['TRIPLE', 'DOUBLE', 'BIG_SMALL', 'SINGLE', 'NONE'].includes(weekend)) config.weekendType = weekend
  const holidayMode = params.get('holidayMode') as HolidayMode | null
  if (holidayMode && ['STANDARD', 'CUSTOM'].includes(holidayMode)) config.holidayMode = holidayMode
  const start = params.get('workStart')
  const end = params.get('workEnd')
  if (start && /^\d{2}:\d{2}$/.test(start)) config.workStart = start
  if (end && /^\d{2}:\d{2}$/.test(end)) config.workEnd = end
  HOLIDAYS.forEach(({ key }) => {
    const value = params.get(`holiday_${key}`)
    if (value !== null && Number.isFinite(Number(value))) config.customHolidays[key] = Number(value)
  })
  return config
}

export function configToSearch(config: LifeConfig): string {
  const params = new URLSearchParams()
  numericKeys.forEach((key) => params.set(key, String(config[key])))
  params.set('workStart', config.workStart)
  params.set('workEnd', config.workEnd)
  params.set('weekendType', config.weekendType)
  params.set('holidayMode', config.holidayMode)
  HOLIDAYS.forEach(({ key }) => params.set(`holiday_${key}`, String(config.customHolidays[key])))
  return params.toString()
}
