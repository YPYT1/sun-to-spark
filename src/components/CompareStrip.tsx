import { useMemo } from 'react'
import { calculateLifeTimeBill } from '../lib/algorithm'
import { describeDelta, workShareColor } from '../lib/insights'
import { COMPARE_PRESETS } from '../lib/constants'
import type { BillResult, LifeConfig } from '../types'

interface CompareStripProps {
  config: LifeConfig
  result: BillResult
  onApply: (values: Partial<LifeConfig>) => void
}

export function CompareStrip({ config, result, onApply }: CompareStripProps) {
  const rows = useMemo(() => COMPARE_PRESETS
    .map((preset) => {
      const next = calculateLifeTimeBill({ ...config, ...preset.values })
      return {
        ...preset,
        workPercentage: next.workPercentage,
        freePercentage: next.freePercentage,
        delta: describeDelta(result.workPercentage, next.workPercentage),
        isCurrent:
          Math.abs(next.workHours - result.workHours) < 1
          && Math.abs(next.freeHours - result.freeHours) < 1,
      }
    })
    .sort((a, b) => b.workPercentage - a.workPercentage), [config, result])

  return (
    <div className="compare-strip" id="compare">
      <div className="compare-head">
        <span>换一种活法</span>
        <p>用同一人生坐标，对比不同作息会偷走多少时间。</p>
      </div>
      <div className="compare-rows">
        {rows.map((row) => (
          <button
            type="button"
            className={`compare-row${row.isCurrent ? ' current' : ''}`}
            key={row.name}
            onClick={() => {
              onApply(row.values)
              document.querySelector('#bill')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
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
          </button>
        ))}
      </div>
    </div>
  )
}
