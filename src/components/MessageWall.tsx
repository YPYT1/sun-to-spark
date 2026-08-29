import { ChevronDown, Heart, Pause, Play, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { fetchMessages, isMessageNetworkError, likeMessage, postMessage } from '../lib/message-api'
import {
  OFFLINE_MESSAGES,
  readMessageCache,
  readMessageOutbox,
  writeMessageCache,
  writeMessageOutbox,
} from '../lib/message-offline'
import {
  assignPaletteIndices,
  countCharacters,
  distributeMessages,
  excerptMessage,
  normalizeMessageBody,
  relativeMessageTime,
  type PublicMessage,
} from '../lib/messages'

const LIQUID_PALETTES = [
  ['#baff45', '#4b8d2b', '#dfffa1'], ['#53f5d2', '#126f72', '#b5fff1'],
  ['#61a9ff', '#334bc4', '#b9dcff'], ['#b98cff', '#6832a8', '#ead6ff'],
  ['#ff85be', '#a92d68', '#ffd0e6'], ['#ff876f', '#a83c31', '#ffd0c6'],
  ['#ffc35e', '#a56520', '#ffe1a0'], ['#e8f16a', '#798523', '#f8ffc0'],
  ['#6ef39a', '#227b47', '#c3ffd4'], ['#5ce8ff', '#216b94', '#c0f7ff'],
  ['#7994ff', '#3f4a9e', '#c8d1ff'], ['#d47cff', '#832a9b', '#f2c8ff'],
  ['#ff78e1', '#9d307f', '#ffc9f3'], ['#ff6f91', '#9a2c4b', '#ffc5d2'],
  ['#ffa45c', '#914c28', '#ffd1a5'], ['#d8ff66', '#5c8129', '#ecffad'],
  ['#80ffd5', '#287765', '#c9ffed'], ['#8bd5ff', '#315d91', '#d1edff'],
] as const

function useColumnCount() {
  const [count, setCount] = useState(() => window.innerWidth <= 680 ? 1 : window.innerWidth <= 1040 ? 2 : 3)
  useEffect(() => {
    const update = () => setCount(window.innerWidth <= 680 ? 1 : window.innerWidth <= 1040 ? 2 : 3)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return count
}

function LiquidMessageCard({
  message,
  paletteIndex,
  expanded,
  onToggle,
  liked,
  liking,
  onLike,
}: {
  message: PublicMessage
  paletteIndex: number
  expanded: boolean
  onToggle: () => void
  liked: boolean
  liking: boolean
  onLike: () => void
}) {
  const palette = LIQUID_PALETTES[paletteIndex]!
  const excerpt = excerptMessage(message.body)
  const unliking = liking && liked
  const style = {
    '--liquid-a': palette[0],
    '--liquid-b': palette[1],
    '--liquid-c': palette[2],
    '--liquid-delay': `${-(paletteIndex % 7) * 1.15}s`,
  } as CSSProperties

  return (
    <article className={`message-card${expanded ? ' expanded' : ''}${liking ? unliking ? ' is-being-unliked' : ' is-being-liked' : ''}`} style={style}>
      <span className="message-liquid liquid-one" /><span className="message-liquid liquid-two" /><span className="message-liquid liquid-three" />
      <div className="message-card-content">
        <p>{expanded ? message.body : excerpt.text}</p>
        <footer>
          <time dateTime={message.createdAt}>{relativeMessageTime(message.createdAt)}</time>
          <div className="message-card-actions">
            {excerpt.expandable && (
              <button className="message-expand" type="button" onClick={onToggle} aria-expanded={expanded}>
                {expanded ? '收起' : '展开全文'} <ChevronDown size={13} />
              </button>
            )}
            <button className={`message-like${liked ? ' liked' : ''}${liking ? unliking ? ' is-unliking' : ' is-liking' : ''}`} type="button" onClick={onLike} aria-pressed={liked} disabled={liking}>
              <span className="message-like-flare" aria-hidden="true"><i /><i /><i /><i /></span>
              <span className="message-like-heart"><Heart size={13} fill={liked || liking ? 'currentColor' : 'none'} /></span>
              <span className="message-like-count">{message.likes}</span>
            </button>
          </div>
        </footer>
      </div>
    </article>
  )
}

export function MessageWall() {
  const [messages, setMessages] = useState<PublicMessage[]>([])
  const [body, setBody] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(window.localStorage.getItem('life-time-bill-liked-messages') ?? '[]')) } catch { return new Set() }
  })
  const [likingIds, setLikingIds] = useState<Set<string>>(() => new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [manualPaused, setManualPaused] = useState(false)
  const [keyboardPaused, setKeyboardPaused] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const columnCount = useColumnCount()
  const length = countCharacters(body)

  const addMessage = useCallback((created: PublicMessage) => {
    setMessages((current) => [created, ...current.filter((item) => item.id !== created.id)].slice(0, 60))
  }, [])

  const flushOutbox = useCallback(async () => {
    const pending = readMessageOutbox()
    if (!pending.length || !navigator.onLine) return
    const remaining = [...pending]
    let delivered = 0
    for (const item of pending) {
      try {
        const created = await postMessage(item.body, item.requestId)
        addMessage(created)
        remaining.shift()
        writeMessageOutbox(remaining)
        delivered += 1
      } catch {
        break
      }
    }
    if (delivered > 0) setNotice(delivered === 1 ? '网络已恢复，暂存的留言已发送' : `网络已恢复，${delivered} 条暂存留言已发送`)
  }, [addMessage])

  const load = useCallback(async (quiet = false) => {
    try {
      const next = await fetchMessages()
      setMessages(Array.isArray(next) ? next : [])
      writeMessageCache(next)
      if (!quiet) setNotice('')
    } catch (error) {
      if (!quiet) {
        const cached = readMessageCache()
        setMessages((current) => current.length ? current : cached.length ? cached : OFFLINE_MESSAGES)
        setNotice('网络不稳定，正在显示离线留言；发送内容会自动重试')
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const retry = () => { void flushOutbox() }
    window.addEventListener('online', retry)
    const timer = window.setInterval(retry, 20_000)
    void flushOutbox()
    return () => {
      window.removeEventListener('online', retry)
      window.clearInterval(timer)
    }
  }, [flushOutbox])
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) void load(true)
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [load])
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const paletteIndices = useMemo(() => assignPaletteIndices(messages), [messages])
  const columns = useMemo(() => distributeMessages(messages, columnCount), [messages, columnCount])
  const paused = manualPaused || keyboardPaused || Boolean(expandedId) || hidden || reducedMotion

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeMessageBody(body)
    if (!normalized) return setNotice('先写下一句话')
    if (countCharacters(normalized) > 200) return setNotice('留言最多 200 字')
    setSubmitting(true)
    setNotice('')
    const requestId = crypto.randomUUID()
    try {
      const created = await postMessage(normalized, requestId)
      addMessage(created)
      setBody('')
      setNotice('这句话已经留在这里了')
    } catch (error) {
      if (isMessageNetworkError(error)) {
        const pending = readMessageOutbox()
        if (!pending.some((item) => item.requestId === requestId)) writeMessageOutbox([...pending, { requestId, body: normalized }])
        setBody('')
        setNotice('网络不稳定，这句话已暂存，恢复后会自动发送')
      } else {
        setNotice(error instanceof Error ? error.message : '提交失败，请稍后再试')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const like = async (id: string) => {
    if (likingIds.has(id)) return
    const desired = !likedIds.has(id)
    setLikingIds((current) => new Set(current).add(id))
    try {
      const result = await likeMessage(id, desired)
      setMessages((current) => current.map((item) => item.id === id ? { ...item, likes: result.likes } : item))
      setLikedIds((current) => {
        const next = new Set(current)
        if (result.liked) next.add(id)
        else next.delete(id)
        window.localStorage.setItem('life-time-bill-liked-messages', JSON.stringify([...next]))
        return next
      })
    } catch (error) {
      setNotice(isMessageNetworkError(error) ? '网络连接不稳定，点赞未保存' : '点赞失败，请稍后再试')
    } finally {
      setLikingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <section className="closing-section message-wall" id="messages">
      <div className="closing-noise" />
      <div className={`message-stage${paused ? ' is-paused' : ''}`}>
        <header className="message-toolbar">
          <div className="message-wall-identity">
            <span className="section-badge liquid-glass">最后一笔</span>
            <div>
              <h2>匿名留言墙</h2>
              <p>{loading ? '正在读取留言…' : `${messages.length} 句话正在流动`}</p>
            </div>
          </div>
          <form
            className="message-composer liquid-glass-strong"
            onSubmit={submit}
            onKeyDownCapture={(event) => { if (event.key === 'Tab') setKeyboardPaused(true) }}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardPaused(false) }}
          >
            <textarea
              id="message-body"
              value={body}
              maxLength={200}
              onChange={(event) => setBody(event.target.value)}
              placeholder="匿名留一句话，最多 200 字…"
              rows={2}
            />
            <div className="message-composer-foot">
              <div><span>{length} / 200</span><span className="message-notice" role="status">{notice}</span></div>
              <button className="message-submit" type="submit" disabled={submitting || length === 0 || length > 200}>
                {submitting ? '发送中…' : '发送'} <Send size={15} />
              </button>
            </div>
          </form>
          <button className="message-pause" type="button" onClick={() => setManualPaused((value) => !value)} aria-pressed={manualPaused}>
            {manualPaused ? <Play size={14} /> : <Pause size={14} />}{manualPaused ? '继续' : '暂停'}
          </button>
        </header>

        <div className="message-columns" aria-live="polite">
          {columns.map((column, columnIndex) => (
            <div className={`message-column direction-${columnIndex === 1 ? 'down' : 'up'}`} key={columnIndex}>
              <div className="message-track" style={{ '--track-duration': `${[52, 64, 57][columnIndex] ?? 52}s` } as CSSProperties}>
                {[0, 1].map((copy) => (
                  <div className="message-track-group" data-loop-copy={copy} key={copy}>
                    {column.map((message) => (
                      <LiquidMessageCard
                        message={message}
                        paletteIndex={paletteIndices.get(message.id) ?? 0}
                        expanded={expandedId === message.id}
                        onToggle={() => setExpandedId((current) => current === message.id ? null : message.id)}
                        liked={likedIds.has(message.id)}
                        liking={likingIds.has(message.id)}
                        onLike={() => void like(message.id)}
                        key={`${copy}-${message.id}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
