import { toPng } from 'html-to-image'
import { Download, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatFull } from '../lib/algorithm'
import type { BillResult, LifeConfig } from '../types'

interface PosterModalProps {
  open: boolean
  onClose: () => void
  config: LifeConfig
  result: BillResult
}

export function PosterModal({ open, onClose, config, result }: PosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  if (!open) return null

  const download = async () => {
    if (!posterRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#050505' })
      const link = document.createElement('a')
      link.download = `余生账单-${config.currentAge}岁.png`
      link.href = dataUrl
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="人生账单海报预览">
      <div className="poster-dialog">
        <div className="poster-toolbar"><span>海报预览 · 9:16</span><button onClick={onClose}><X size={20} /></button></div>
        <div className="poster-scroll">
          <div className="poster" ref={posterRef}>
            <div className="poster-glow" />
            <div className="poster-brand"><span className="brand-mark"><span /></span><b>余生账单</b></div>
            <p className="poster-kicker">LIFE TIME BILL · PERSONAL ARCHIVE</p>
            <h2>我把多少人生，<br />交给了工作？</h2>
            <div className="poster-rule" />
            <section><span>工作占用 / WORK</span><strong>{formatFull(result.workBill)}</strong><small>{result.workBill.totalHours.toLocaleString()} 小时</small></section>
            <section className="poster-free"><span>余生自由 / FREEDOM</span><strong>{formatFull(result.freeBill)}</strong><small>{result.freeBill.totalHours.toLocaleString()} 小时</small></section>
            <div className="poster-ratio"><div><span style={{ width: `${result.workPercentage}%` }} /><i style={{ width: `${result.maintenancePercentage}%` }} /><b style={{ width: `${result.freePercentage}%` }} /></div><p>工作 {result.workPercentage.toFixed(1)}% · 生存 {result.maintenancePercentage.toFixed(1)}% · 自由 {result.freePercentage.toFixed(1)}%</p></div>
            <div className="poster-meta"><span>{config.currentAge} 岁 → {config.lifeExpectancy} 岁</span><span>{config.workStart} — {config.workEnd}</span></div>
            <footer><span>时间不是拥有的东西，<br />时间就是你的人生。</span><span className="poster-code">L T B<br />2 0 2 6</span></footer>
          </div>
        </div>
        <button className="download-poster" onClick={download} disabled={exporting}><Download size={18} /> {exporting ? '正在生成…' : '下载高清账单'}</button>
      </div>
    </div>
  )
}
