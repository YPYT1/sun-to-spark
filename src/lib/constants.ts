import type { HolidayKey, LifeConfig, WeekendType } from '../types'

export const WEEKEND_TYPES: WeekendType[] = ['TRIPLE', 'DOUBLE', 'BIG_SMALL', 'SINGLE', 'NONE']

export const WEEKEND_OPTIONS: Array<{ value: WeekendType; label: string }> = [
  { value: 'TRIPLE', label: '三休' },
  { value: 'DOUBLE', label: '双休' },
  { value: 'BIG_SMALL', label: '大小休' },
  { value: 'SINGLE', label: '单休' },
  { value: 'NONE', label: '无休' },
]

export const HOLIDAYS: Array<{ key: HolidayKey; name: string; legalDays: number; displayDays: number }> = [
  { key: 'newYear', name: '元旦', legalDays: 1, displayDays: 1 },
  { key: 'spring', name: '春节', legalDays: 4, displayDays: 8 },
  { key: 'qingming', name: '清明', legalDays: 1, displayDays: 3 },
  { key: 'labor', name: '劳动节', legalDays: 2, displayDays: 5 },
  { key: 'dragonBoat', name: '端午', legalDays: 1, displayDays: 3 },
  { key: 'midAutumn', name: '中秋', legalDays: 1, displayDays: 3 },
  { key: 'national', name: '国庆', legalDays: 3, displayDays: 7 },
]

export const DEFAULT_CONFIG: LifeConfig = {
  currentAge: 25,
  retireAge: 65,
  lifeExpectancy: 80,
  workStart: '10:00',
  workEnd: '20:00',
  breakHours: 2.5,
  weekendType: 'BIG_SMALL',
  holidayMode: 'STANDARD',
  annualLeave: 5,
  customHolidays: Object.fromEntries(HOLIDAYS.map((holiday) => [holiday.key, holiday.displayDays])) as LifeConfig['customHolidays'],
  sleepHours: 7.5,
  commuteHours: 1.5,
  choresHours: 1.5,
}

export const PRESETS: Array<{ name: string; note: string; values: Partial<LifeConfig> }> = [
  {
    name: '996打工人',
    note: '单休 · 10:00—22:00',
    values: { retireAge: 65, workStart: '10:00', workEnd: '22:00', breakHours: 2, weekendType: 'SINGLE', annualLeave: 0 },
  },
  {
    name: '大小休打工人',
    note: '大小休 · 10:00—20:00',
    values: { retireAge: 65, workStart: '10:00', workEnd: '20:00', breakHours: 2.5, weekendType: 'BIG_SMALL', annualLeave: 5 },
  },
  {
    name: '体制内 / 外企',
    note: '双休 · 09:00—17:00',
    values: { retireAge: 60, workStart: '09:00', workEnd: '17:00', breakHours: 1, weekendType: 'DOUBLE', annualLeave: 10 },
  },
  {
    name: '北欧福利',
    note: '三休 · 10:00—17:00',
    values: { retireAge: 60, workStart: '10:00', workEnd: '17:00', breakHours: 1, weekendType: 'TRIPLE', annualLeave: 20 },
  },
  {
    name: '顶级牛马',
    note: '无休 · 09:00—21:00',
    values: { retireAge: 65, workStart: '09:00', workEnd: '21:00', breakHours: 2, weekendType: 'NONE', annualLeave: 0 },
  },
]

/** 结果区「换一种活法」对比项（含首页预设 + 额外场景） */
export const COMPARE_PRESETS: Array<{ name: string; note: string; values: Partial<LifeConfig> }> = [
  ...PRESETS,
  {
    name: '标准打工人',
    note: '双休 · 09:00—18:00',
    values: { retireAge: 65, workStart: '09:00', workEnd: '18:00', breakHours: 1, weekendType: 'DOUBLE', annualLeave: 5 },
  },
  {
    name: '北漂通勤党',
    note: '大小休 · 09:00—19:00 · 通勤 3.5h',
    values: { retireAge: 65, workStart: '09:00', workEnd: '19:00', breakHours: 2, weekendType: 'BIG_SMALL', annualLeave: 5, commuteHours: 3.5 },
  },
]
