import { ChevronDown, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { HOLIDAYS } from '../lib/constants'
import type { HolidayKey, LifeConfig } from '../types'

interface ControlSectionProps {
  config: LifeConfig
  onChange: (patch: Partial<LifeConfig>) => void
  onHolidayChange: (key: HolidayKey, value: number) => void
  onReset: () => void
}

interface RangeFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix: string
  onChange: (value: number) => void
}

function RangeField({ label, value, min, max, step = 1, suffix, onChange }: RangeFieldProps) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <label className="range-field">
      <span className="field-label"><span>{label}</span><strong>{value}<em>{suffix}</em></strong></span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ '--progress': `${progress}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void; label: string }) {
  return (
    <fieldset className="segmented-field">
      <legend>{label}</legend>
      <div className="segmented liquid-glass">
        {options.map((option) => <button type="button" className={option.value === value ? 'active' : ''} key={option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
      </div>
    </fieldset>
  )
}

export function ControlSection({ config, onChange, onHolidayChange, onReset }: ControlSectionProps) {
  return (
    <section className="section calculator-section" id="calculator">
      <motion.div className="section-intro" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}>
        <span className="section-index">01 / 输入</span>
        <div>
          <span className="section-badge liquid-glass">你的时间参数</span>
          <h2>先写下你现在<br />怎样度过一天。</h2>
          <p>每一次调整都会立刻改写后面的账单。没有提交按钮，也没有标准答案。</p>
        </div>
      </motion.div>

      <motion.div className="control-console liquid-glass-strong" initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }}>
        <div className="console-head"><div><span>PROFILE</span><h3>人生坐标</h3></div><button className="icon-button" onClick={onReset} title="恢复默认值"><RotateCcw size={17} /></button></div>
        <div className="field-grid three">
          <RangeField label="当前年龄" value={config.currentAge} min={16} max={75} suffix="岁" onChange={(currentAge) => onChange({ currentAge, retireAge: Math.max(config.retireAge, currentAge + 1) })} />
          <RangeField label="退休年龄" value={config.retireAge} min={Math.max(40, config.currentAge + 1)} max={75} suffix="岁" onChange={(retireAge) => onChange({ retireAge, lifeExpectancy: Math.max(config.lifeExpectancy, retireAge) })} />
          <RangeField label="预期寿命" value={config.lifeExpectancy} min={Math.max(60, config.retireAge)} max={100} suffix="岁" onChange={(lifeExpectancy) => onChange({ lifeExpectancy })} />
        </div>

        <div className="console-divider" />
        <div className="console-head"><div><span>SCHEDULE</span><h3>工作作息</h3></div></div>
        <div className="time-row">
          <label className="time-field"><span>上班时间</span><input type="time" value={config.workStart} onChange={(event) => onChange({ workStart: event.target.value })} /></label>
          <span className="time-arrow">→</span>
          <label className="time-field"><span>下班时间</span><input type="time" value={config.workEnd} onChange={(event) => onChange({ workEnd: event.target.value })} /></label>
          <RangeField label="中途休息" value={config.breakHours} min={0} max={5} step={0.5} suffix="小时" onChange={(breakHours) => onChange({ breakHours })} />
        </div>
        <Segmented label="周休制度" value={config.weekendType} onChange={(weekendType) => onChange({ weekendType })} options={[
          { value: 'DOUBLE', label: '双休' }, { value: 'BIG_SMALL', label: '大小休' }, { value: 'SINGLE', label: '单休' }, { value: 'NONE', label: '无休' },
        ]} />

        <div className="console-divider" />
        <div className="console-head"><div><span>HOLIDAYS</span><h3>假期与调休</h3></div></div>
        <div className="holiday-row">
          <Segmented label="节假日模式" value={config.holidayMode} onChange={(holidayMode) => onChange({ holidayMode })} options={[{ value: 'STANDARD', label: '国家标准' }, { value: 'CUSTOM', label: '自定义' }]} />
          <RangeField label="带薪年假" value={config.annualLeave} min={0} max={30} suffix="天" onChange={(annualLeave) => onChange({ annualLeave })} />
        </div>
        {config.holidayMode === 'CUSTOM' && (
          <motion.div className="holiday-grid" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            {HOLIDAYS.map((holiday) => (
              <label key={holiday.key}><span>{holiday.name}<small>法定 {holiday.legalDays} 天</small></span><input type="number" min="0" max="15" value={config.customHolidays[holiday.key]} onChange={(event) => onHolidayChange(holiday.key, Number(event.target.value))} /></label>
            ))}
          </motion.div>
        )}

        <details className="advanced">
          <summary><span><b>生存必要损耗</b><small>睡眠、通勤与日常杂务</small></span><ChevronDown size={18} /></summary>
          <div className="field-grid three advanced-fields">
            <RangeField label="每日睡眠" value={config.sleepHours} min={4} max={12} step={0.5} suffix="小时" onChange={(sleepHours) => onChange({ sleepHours })} />
            <RangeField label="往返通勤" value={config.commuteHours} min={0} max={5} step={0.5} suffix="小时" onChange={(commuteHours) => onChange({ commuteHours })} />
            <RangeField label="生存杂务" value={config.choresHours} min={0} max={4} step={0.5} suffix="小时" onChange={(choresHours) => onChange({ choresHours })} />
          </div>
        </details>
      </motion.div>
    </section>
  )
}
