import { ArrowUpRight, Download, Link2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { formatFull } from '../lib/algorithm'
import type { BillResult, TimeUnits } from '../types'

type Granularity = 'FULL' | 'MONTH' | 'DAY'

function formatByGranularity(units: TimeUnits, granularity: Granularity) {
  if (granularity === 'MONTH') return `${units.totalMonths.toLocaleString()}个月 ${units.days}天 ${units.hours}小时`
  if (granularity === 'DAY') return `${units.totalDays.toLocaleString()}天 ${units.hours}小时`
  return formatFull(units)
}

interface ResultSectionProps {
  result: BillResult
  retireAge: number
  lifeExpectancy: number
  onPoster: () => void
}

export function ResultSection({ result, retireAge, lifeExpectancy, onPoster }: ResultSectionProps) {
  const [granularity, setGranularity] = useState<Granularity>('FULL')
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
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
            <p>到您 <strong>{retireAge}</strong> 岁退休，累计被工作占用的时间是</p>
            <motion.h3 key={`work-${granularity}-${result.workBill.totalHours}`} initial={{ opacity: 0.35, y: 8 }} animate={{ opacity: 1, y: 0 }}>{formatByGranularity(result.workBill, granularity)}</motion.h3>
            <span>共 {result.workBill.totalHours.toLocaleString()} 小时 · 占剩余人生 {result.workPercentage.toFixed(1)}% · 包含工作日内的休息时间</span>
          </div>

          <div className="bill-separator"><span>VS</span></div>

          <div className="bill-primary free">
            <p>从现在到预期 <strong>{lifeExpectancy}</strong> 岁，真正自由支配的时间是</p>
            <motion.h3 key={`free-${granularity}-${result.freeBill.totalHours}`} initial={{ opacity: 0.35, y: 8 }} animate={{ opacity: 1, y: 0 }}>{formatByGranularity(result.freeBill, granularity)}</motion.h3>
            <span>共 {result.freeBill.totalHours.toLocaleString()} 小时 · 占剩余人生 {result.freePercentage.toFixed(1)}% · 含退休后 {formatFull(result.postRetirementFreeBill)}</span>
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
              <span><i className="freedom" />真正自由 <b>{result.freePercentage.toFixed(1)}%</b></span>
            </div>
          </div>

          <div className="bill-actions">
            <button className="glass-button" onClick={onPoster}><Download size={17} /> 生成人生账单卡片 <ArrowUpRight size={16} /></button>
            <button className="text-button" onClick={copyLink}><Link2 size={16} /> 复制这份账单链接</button>
          </div>
        </motion.div>
      </div>

      <div className="section insight-grid" id="method">
        <article><span>每年出勤</span><strong>{Math.round(result.annualWorkDays)}<small>天</small></strong><p>已扣除周休、法定假期与年假。</p></article>
        <article><span>每日工作占用</span><strong>{result.dailySpanHours.toFixed(1)}<small>小时</small></strong><p>从上班到下班，包含工作日内的休息时间。</p></article>
        <article><span>退休后自由</span><strong>{result.postRetirementFreeBill.years}<small>年+</small></strong><p>{formatFull(result.postRetirementFreeBill)}，已扣除睡眠与日常杂务。</p></article>
      </div>
    </section>
  )
}
