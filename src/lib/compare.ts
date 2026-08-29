import { getDailySpanHours } from './algorithm'
import type { LifeConfig } from '../types'

export type CompareTierName =
  | '996打工人'
  | '大小休打工人'
  | '体制内 / 外企'
  | '北欧福利'
  | '顶级牛马'
  | '标准打工人'
  | '北漂通勤党'

export function matchCompareTier(config: LifeConfig): CompareTierName {
  if (config.weekendType === 'NONE') return '顶级牛马'
  if (config.weekendType === 'SINGLE') return '996打工人'
  if (config.weekendType === 'BIG_SMALL') {
    return config.commuteHours > 3 ? '北漂通勤党' : '大小休打工人'
  }
  if (config.weekendType === 'TRIPLE') return '北欧福利'

  return getDailySpanHours(config.workStart, config.workEnd) <= 8.25
    ? '体制内 / 外企'
    : '标准打工人'
}
