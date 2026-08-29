import { ArrowUpRight, Check, Download, Link2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { formatFull } from '../lib/algorithm'
import { buildInsights } from '../lib/insights'
import { resetLiquidPointer, trackLiquidPointer } from '../lib/liquid-pointer'
import { CompareStrip } from './CompareStrip'
import type { BillResult, LifeConfig, TimeUnits } from '../types'

type Granularity = 'FULL' | 'MONTH' | 'DAY'

function formatByGranularity(units: TimeUnits, granularity: Granularity) {
  if (granularity === 'MONTH') return `${units.totalMonths.toLocaleString()}个月 ${units.days}天 ${units.hours}小时`
  if (granularity === 'DAY') return `${units.totalDays.toLocaleString()}天 ${units.hours}小时`
  return formatFull(units)
}

interface ResultSectionProps {
  config: LifeConfig
  result: BillResult
  onPoster: () => void
}

export function ResultSection({ config, result, onPoster }: ResultSectionProps) {
  const [granularity, setGranularity] = useState<Granularity>('FULL')
  const [copied, setCopied] = useState(false)
  const insights = buildInsights(result)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="bill-section" id="bill">
      <div className="section bill-heading">
        <span className="section-index">02 / 结果</span>
        <div><span className="section-badge liquid-glass">你的余生账单</span><h2>时间从来不抽象。<br />它只是在被谁使用。</h2></div>
      </div>

      <div className="bill-stage">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <motion.div className="bill-card liquid-glass-strong" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }}>
          <div className="bill-topline"><span>LIFE TIME BILL / 2026</span><div className="granularity-tabs">{([['FULL', '年月日'], ['MONTH', '月'], ['DAY', '日']] as const).map(([value, label]) => <button className={granularity === value ? 'active' : ''} onClick={() => setGranularity(value)} key={value}>{label}</button>)}</div></div>

          <div className="bill-primary">
            <p>到您 <strong>{config.retireAge}</strong> 岁退休，累计被工作占用的时间是</p>
            <motion.h3 key={`work-${granularity}-${result.workBill.totalHours}`} initial={{ opacity: 0.35, y: 8 }} animate={{ opacity: 1, y: 0 }}>{formatByGranularity(result.workBill, granularity)}</motion.h3>
            <span>共 {result.workBill.totalHours.toLocaleString()} 小时 · 占剩余人生 {result.workPercentage.toFixed(1)}% · 按上班到下班的完整在岗时间统计</span>
          </div>

          <div className="bill-separator"><span>VS</span></div>

          <div className="bill-primary free">
            <p>到您 <strong>{config.retireAge}</strong> 岁退休，真正自由支配的时间是</p>
            <motion.h3 key={`pre-free-${granularity}-${result.preRetirementFreeBill.totalHours}`} initial={{ opacity: 0.35, y: 8 }} animate={{ opacity: 1, y: 0 }}>{formatByGranularity(result.preRetirementFreeBill, granularity)}</motion.h3>
            <span>共 {result.preRetirementFreeBill.totalHours.toLocaleString()} 小时 · 占剩余人生 <strong className="share-pct">{result.preRetirementFreePercentage.toFixed(1)}%</strong> · 仅统计退休前</span>
          </div>

          <div className="bill-free-breakdown">
            <article className="bill-free-tier">
              <span>退休后自由</span>
              <strong>{formatByGranularity(result.postRetirementFreeBill, granularity)}</strong>
              <small>从 {config.retireAge} 岁到预期 {config.lifeExpectancy} 岁 · 共 {result.postRetirementFreeBill.totalHours.toLocaleString()} 小时 · 占剩余人生 <strong className="share-pct">{result.postRetirementFreePercentage.toFixed(1)}%</strong></small>
            </article>
            <article className="bill-free-tier total">
              <span>全生命周期自由总计</span>
              <strong>{formatByGranularity(result.freeBill, granularity)}</strong>
              <small>从现在到预期 {config.lifeExpectancy} 岁 · 共 {result.freeBill.totalHours.toLocaleString()} 小时 · 占剩余人生 <strong className="share-pct">{result.freePercentage.toFixed(1)}%</strong> · 退休前 + 退休后</small>
            </article>
          </div>

          <div className="time-composition">
            <div className="composition-bar" aria-label="剩余人生时间组成">
              <span className="work" style={{ width: `${result.workPercentage}%` }} />
              <span className="maintenance" style={{ width: `${result.maintenancePercentage}%` }} />
              <span className="freedom" style={{ width: `${result.freePercentage}%` }} />
            </div>
            <div className="composition-legend">
              <span><i className="work" />工作 <b>{result.workPercentage.toFixed(1)}%</b></span>
              <span><i className="maintenance" />生存损耗 <b>{result.maintenancePercentage.toFixed(1)}%</b></span>
              <span><i className="freedom" />真正自由 <b className="share-pct">{result.freePercentage.toFixed(1)}%</b></span>
            </div>
          </div>

          <p className="bill-footnote">
            分母是「现在 → 预期寿命」的全部剩余人生；工作按在岗跨度计入（含午休）；退休前自由不含退休后时段；全生命周期自由 = 退休前 + 退休后。
          </p>

          <details className="insight-fold liquid-follow" onPointerMove={trackLiquidPointer} onPointerLeave={resetLiquidPointer}>
            <summary>
              <span>具象化感受</span>
              <small>分别感受退休前、退休后与全生命周期自由</small>
            </summary>
            <div className="insight-lines">
              {insights.map((line) => (
                <div className="insight-line" key={line.label}>
                  <span>{line.label}</span>
                  <strong>{line.value}</strong>
                  <small>{line.note}</small>
                </div>
              ))}
            </div>
          </details>

          <div className="bill-actions">
            <button className="glass-button" onClick={onPoster}><Download size={17} /> 生成人生账单卡片 <ArrowUpRight size={16} /></button>
            <button className="text-button" onClick={copyLink}>
              {copied ? <Check size={16} /> : <Link2 size={16} />}
              {copied ? '链接已复制' : '复制这份账单链接'}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="section">
        <CompareStrip config={config} result={result} />
      </div>

      <div className="section insight-grid">
        <article><span>退休前自由</span><strong>{result.preRetirementFreeBill.years}<small>年+</small></strong><p>{formatFull(result.preRetirementFreeBill)}，截至 {config.retireAge} 岁。</p></article>
        <article><span>退休后自由</span><strong>{result.postRetirementFreeBill.years}<small>年+</small></strong><p>{formatFull(result.postRetirementFreeBill)}，{config.retireAge} 岁 → {config.lifeExpectancy} 岁。</p></article>
        <article><span>自由总计</span><strong>{result.freeBill.years}<small>年+</small></strong><p>{formatFull(result.freeBill)}，占剩余人生 <strong className="share-pct">{result.freePercentage.toFixed(1)}%</strong>。</p></article>
      </div>
    </section>
  )
}
