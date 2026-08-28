import { useEffect, useMemo, useRef, useState } from 'react'
import { AdminPage } from './components/AdminPage'
import { ControlSection } from './components/ControlSection'
import { HeroSection } from './components/HeroSection'
import { MessageWall } from './components/MessageWall'
import { PosterModal } from './components/PosterModal'
import { ResultSection } from './components/ResultSection'
import { SeoContent } from './components/SeoContent'
import { UpdateToast } from './components/UpdateToast'
import { calculateLifeTimeBill } from './lib/algorithm'
import { DEFAULT_CONFIG } from './lib/constants'
import { configToSearch, readConfigFromUrl } from './lib/urlState'
import type { HolidayKey, LifeConfig } from './types'

const STORAGE_KEY = 'life-time-bill'

function readStoredConfig(): LifeConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...structuredClone(DEFAULT_CONFIG), ...JSON.parse(raw) } as LifeConfig
  } catch {
    return null
  }
}

function SiteApp() {
  const [config, setConfig] = useState<LifeConfig>(() => readConfigFromUrl(window.location.search))
  const [posterOpen, setPosterOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [canRestore, setCanRestore] = useState(() => Boolean(readStoredConfig()))
  const skipToast = useRef(true)
  const result = useMemo(() => calculateLifeTimeBill(config), [config])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = configToSearch(config)
      window.history.replaceState(null, '', `${window.location.pathname}?${query}${window.location.hash}`)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      setCanRestore(true)
    }, 150)
    return () => window.clearTimeout(timeout)
  }, [config])

  useEffect(() => {
    if (skipToast.current) {
      skipToast.current = false
      return
    }
    setToastVisible(true)
    const timeout = window.setTimeout(() => setToastVisible(false), 2600)
    return () => window.clearTimeout(timeout)
  }, [result.workHours, result.freeHours])

  const change = (patch: Partial<LifeConfig>) => setConfig((current) => ({ ...current, ...patch }))
  const changeHoliday = (key: HolidayKey, value: number) => setConfig((current) => ({
    ...current,
    customHolidays: { ...current.customHolidays, [key]: Math.max(0, Math.min(15, value)) },
  }))
  const restoreLast = () => {
    const stored = readStoredConfig()
    if (stored) setConfig(stored)
  }

  return (
    <main>
      <HeroSection onPreset={change} />
      <ControlSection
        config={config}
        onChange={change}
        onHolidayChange={changeHoliday}
        onReset={() => setConfig(structuredClone(DEFAULT_CONFIG))}
        onRestore={restoreLast}
        canRestore={canRestore}
      />
      <ResultSection
        config={config}
        result={result}
        onPoster={() => setPosterOpen(true)}
      />
      <MessageWall />
      <SeoContent />
      <footer className="site-footer">
        <a className="brand" href="#top"><span className="brand-mark"><span /></span><span>余生账单</span></a>
        <p>© 2026 Life Time Bill · 作者 @LiamWang · 邮箱 <a href="mailto:ypyt147@163.com">ypyt147@163.com</a> · 账单参数仅保存在你的浏览器中</p>
        <div><a href="#method">计算方式</a><a href="#compare">对比活法</a><a href="#faq">常见问题</a><a href="#calculator">重新计算</a></div>
      </footer>
      <PosterModal open={posterOpen} onClose={() => setPosterOpen(false)} config={config} result={result} />
      <UpdateToast visible={toastVisible} />
    </main>
  )
}

export default function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminPage /> : <SiteApp />
}
