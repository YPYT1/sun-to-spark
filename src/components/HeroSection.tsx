import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { BlurText } from './BlurText'
import { PRESETS } from '../lib/constants'
import type { LifeConfig } from '../types'

interface HeroSectionProps {
  onPreset: (values: Partial<LifeConfig>) => void
}

export function HeroSection({ onPreset }: HeroSectionProps) {
  const choosePreset = (values: Partial<LifeConfig>) => {
    onPreset(values)
    document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="hero" id="top">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
        aria-hidden="true"
        onCanPlay={(event) => { void event.currentTarget.play().catch(() => undefined) }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="hero-wash" />
      <nav className="nav-shell" aria-label="主导航">
        <a className="brand" href="#top" aria-label="余生账单首页">
          <span className="brand-mark"><span /></span>
          <span>余生账单</span>
        </a>
        <div className="nav-links liquid-glass">
          <a href="#calculator">开始计算</a>
          <a href="#bill">我的账单</a>
          <a href="#method">计算方式</a>
        </div>
        <a className="nav-cta" href="#calculator">算算看 <ArrowUpRight size={16} /></a>
      </nav>

      <div className="hero-content">
        <motion.div className="eyebrow liquid-glass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="live-dot" /> 人生时间账单 · Life Time Bill
        </motion.div>
        <h1>
          <span className="hero-line"><BlurText text="出卖给工作的时间，" /></span>
          <span className="hero-line"><BlurText text="究竟偷走了你多少人生？" /></span>
        </h1>
        <motion.p initial={{ opacity: 0, filter: 'blur(8px)', y: 14 }} animate={{ opacity: 1, filter: 'blur(0)', y: 0 }} transition={{ delay: 1.15, duration: 0.8 }}>
          把上下班、调休、通勤与睡眠放进同一张账单。<br className="hidden sm:block" />看看退休之前，真正属于你的时间还剩多少。
        </motion.p>

        <motion.div className="preset-list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.7 }}>
          {PRESETS.map((preset) => (
            <button className="preset-chip liquid-glass" key={preset.name} onClick={() => choosePreset(preset.values)}>
              <span>{preset.name}</span>
              <small>{preset.note}</small>
            </button>
          ))}
        </motion.div>
      </div>

      <a className="scroll-cue" href="#calculator"><span>向下查看账单</span><ArrowDown size={18} /></a>
    </header>
  )
}
