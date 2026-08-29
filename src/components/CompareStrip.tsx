import { useMemo } from 'react'
import { calculateLifeTimeBill } from '../lib/algorithm'
import { matchCompareTier } from '../lib/compare'
import { describeDelta, workShareColor } from '../lib/insights'
import { COMPARE_PRESETS } from '../lib/constants'
import type { BillResult, LifeConfig } from '../types'

interface CompareStripProps {
  config: LifeConfig
  result: BillResult
}

export function CompareStrip({ config, result }: CompareStripProps) {
  const rows = useMemo(() => {
    const rankedRows = COMPARE_PRESETS
      .map((preset) => {
        const next = calculateLifeTimeBill({ ...config, ...preset.values })
        return {
          ...preset,
          workPercentage: next.workPercentage,
          freePercentage: next.freePercentage,
          delta: describeDelta(result.workPercentage, next.workPercentage),
        }
      })
      .sort((a, b) => b.workPercentage - a.workPercentage)

    const currentTier = matchCompareTier(config)

    return rankedRows.map((row) => ({ ...row, isCurrent: row.name === currentTier }))
  }, [config, result])

  return (
    <div className="compare-strip" id="compare">
      <div className="compare-head">
        <span>换一种活法</span>
        <p>用同一人生坐标，对比不同作息会偷走多少时间。</p>
      </div>
      <div className="compare-rows">
        {rows.map((row) => (
          <article
            className={`compare-row liquid-glass${row.isCurrent ? ' current' : ''}`}
            key={row.name}
            aria-current={row.isCurrent ? 'true' : undefined}
          >
            <span className="compare-name">
              <b>{row.name}</b>
              <small>{row.note}</small>
            </span>
            <span className="compare-stats">
              <strong style={{ color: workShareColor(row.workPercentage) }}>{row.workPercentage.toFixed(1)}%</strong>
              <em>工作占比</em>
            </span>
            <span className="compare-delta">{row.isCurrent ? '当前账单' : row.delta}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
