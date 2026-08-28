import type { BillResult } from '../types'

export interface InsightLine {
  label: string
  value: string
  note: string
}

/** 把抽象小时换算成更好感知的日常单位（估算，用于表达而非会计） */
export function buildInsights(result: BillResult): InsightLine[] {
  const movies = Math.max(0, Math.round(result.workHours / 2))
  const seasons = Math.max(0, Math.round(result.workHours / 20))
  const freeWeekends = Math.max(0, Math.round(result.freeHours / 30))
  const longTrips = Math.max(0, Math.round(result.freeHours / 120))
  const fullSleeps = Math.max(0, Math.round(result.freeHours / 8))

  return [
    {
      label: '工作时间约等于',
      value: `${movies.toLocaleString()} 部电影`,
      note: `或约 ${seasons.toLocaleString()} 季剧集（按 2 小时/部、20 小时/季估算）`,
    },
    {
      label: '真正自由约等于',
      value: `${freeWeekends.toLocaleString()} 个完整周末`,
      note: `或约 ${longTrips.toLocaleString()} 次短途旅行（按 30 小时/周末、120 小时/次估算）`,
    },
    {
      label: '自由时间也可以是',
      value: `${fullSleeps.toLocaleString()} 次睡到自然醒`,
      note: '按每次 8 小时完整休息估算，用来感受「还剩多少自己的时间」',
    },
  ]
}

export function describeDelta(currentWorkPct: number, otherWorkPct: number): string {
  const delta = otherWorkPct - currentWorkPct
  if (Math.abs(delta) < 0.15) return '工作占比几乎一样'
  if (delta > 0) return `工作占比多 ${delta.toFixed(1)} 个百分点`
  return `工作占比少 ${Math.abs(delta).toFixed(1)} 个百分点`
}

/** 工作占比越高，红色越深；越低则越浅 */
export function workShareColor(percentage: number): string {
  const t = Math.min(1, Math.max(0, (percentage - 6) / 34))
  const hue = 4
  const saturation = 52 + t * 30
  const lightness = 74 - t * 38
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

