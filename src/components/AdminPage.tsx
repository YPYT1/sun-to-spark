import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  fetchAdminMessages,
  loginAdmin,
  logoutAdmin,
  muteVisitor,
  restoreMessage,
  setMessageStatus,
  softDeleteMessage,
  type AdminMessageFilter,
  type AdminMessageSort,
  type MuteDuration,
} from '../lib/message-api'
import { formatAdminTimestamp, type AdminMessage } from '../lib/messages'

const MUTE_OPTIONS: Array<{ value: MuteDuration; label: string }> = [
  { value: '1h', label: '1 小时' },
  { value: '1d', label: '1 天' },
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
  { value: 'permanent', label: '永久' },
  { value: 'custom', label: '自定义截止时间' },
]

function isMuted(until: string | null): boolean {
  return Boolean(until && (until === '9999-12-31T23:59:59.999Z' || new Date(until).getTime() > Date.now()))
}

function muteLabel(until: string | null): string {
  if (!isMuted(until)) return ''
  return until === '9999-12-31T23:59:59.999Z' ? '永久禁言' : `禁言至 ${formatAdminTimestamp(until!)}`
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [filter, setFilter] = useState<AdminMessageFilter>('all')
  const [sort, setSort] = useState<AdminMessageSort>('latest')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [muteChoices, setMuteChoices] = useState<Record<string, MuteDuration>>({})
  const [customUntil, setCustomUntil] = useState<Record<string, string>>({})

  const load = useCallback(async (quiet = false) => {
    try {
      const result = await fetchAdminMessages(filter, page, query, sort)
      setAuthenticated(true)
      setMessages(result.messages)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      if (!quiet) setNotice('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败'
      if (message.includes('登录')) setAuthenticated(false)
      else if (!quiet) setNotice(message)
    }
  }, [filter, page, query, sort])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (authenticated !== true) return
    const timer = window.setInterval(() => {
      if (!document.hidden) void load(true)
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [authenticated, load])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await loginAdmin(password)
      setPassword('')
      setAuthenticated(true)
      await load()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '登录失败')
    }
  }

  const search = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setQuery(searchInput.trim())
  }

  const changeStatus = async (message: AdminMessage) => {
    setBusyId(message.id)
    try {
      const status = message.status === 'visible' ? 'hidden' : 'visible'
      await setMessageStatus(message.id, status)
      if (filter === 'all') {
        setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status } : item))
      } else {
        await load()
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (message: AdminMessage) => {
    if (!window.confirm('将这条留言移入“已删除”？之后可以恢复。')) return
    setBusyId(message.id)
    try {
      await softDeleteMessage(message.id)
      if (messages.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  const restore = async (message: AdminMessage) => {
    setBusyId(message.id)
    try {
      await restoreMessage(message.id)
      if (messages.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '恢复失败')
    } finally {
      setBusyId(null)
    }
  }

  const changeMute = async (message: AdminMessage, duration?: MuteDuration) => {
    if (!message.visitorId) return
    const selected = duration ?? muteChoices[message.visitorId] ?? '1d'
    const until = selected === 'custom' ? customUntil[message.visitorId] : undefined
    if (selected === 'custom' && !until) return setNotice('请先选择禁言截止时间')

    setBusyId(message.visitorId)
    try {
      const result = await muteVisitor(message.visitorId, {
        duration: selected,
        until: until ? new Date(until).toISOString() : undefined,
      })
      setMessages((current) => current.map((item) => (
        item.visitorId === message.visitorId ? { ...item, mutedUntil: result.mutedUntil } : item
      )))
      setNotice(selected === 'unmute' ? `已解除 ${message.displayName} 的禁言` : `已禁言 ${message.displayName}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '禁言操作失败')
    } finally {
      setBusyId(null)
    }
  }

  if (authenticated !== true) {
    return (
      <main className="admin-shell admin-login-shell">
        <form className="admin-login liquid-glass-strong" onSubmit={login}>
          <a className="brand" href="/"><span className="brand-mark"><span /></span><span>余生账单</span></a>
          <span>留言管理</span><h1>输入管理密码</h1>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
          <button type="submit">登录</button>
          <p role="status">{authenticated === null ? '正在检查会话…' : notice}</p>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-head">
        <div><a className="brand" href="/"><span className="brand-mark"><span /></span><span>余生账单</span></a><h1>留言管理</h1></div>
        <div className="admin-actions">
          <button onClick={() => void load()}><RefreshCw size={15} />刷新</button>
          <button onClick={async () => { await logoutAdmin(); setAuthenticated(false) }}><LogOut size={15} />退出</button>
        </div>
      </header>

      <section className="admin-controls">
        <nav className="admin-filters" aria-label="留言状态筛选">
          {(['all', 'visible', 'hidden', 'deleted'] as const).map((value) => (
            <button
              className={filter === value ? 'active' : ''}
              onClick={() => { setFilter(value); setPage(1) }}
              key={value}
            >
              {{ all: '全部', visible: '公开', hidden: '已隐藏', deleted: '已删除' }[value]}
            </button>
          ))}
        </nav>
        <label className="admin-sort">
          <span>排序</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value as AdminMessageSort); setPage(1) }}>
            <option value="latest">最新留言</option>
            <option value="likes_desc">点赞从高到低</option>
            <option value="likes_asc">点赞从低到高</option>
          </select>
        </label>
        <form className="admin-search" onSubmit={search}>
          <Search size={16} />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="模糊搜索随机名称或留言内容"
            maxLength={100}
          />
          {query && <button type="button" onClick={() => { setSearchInput(''); setQuery(''); setPage(1) }}>清除</button>}
          <button type="submit">搜索</button>
        </form>
      </section>

      <div className="admin-summary">
        <span>{query ? `“${query}”共找到 ${total} 条` : `共 ${total} 条留言`}</span>
        <span>每 10 秒同步点赞 · 第 {totalPages ? page : 0} / {totalPages} 页</span>
      </div>
      <p className="admin-notice" role="status">{notice}</p>

      <section className="admin-message-list">
        {messages.map((message) => {
          const visitorId = message.visitorId
          const deleted = Boolean(message.deletedAt)
          const visitorMuted = isMuted(message.mutedUntil)
          const visitorBusy = busyId === visitorId
          const selectedMute = visitorId ? muteChoices[visitorId] ?? '1d' : '1d'
          return (
            <article className="admin-message liquid-glass" key={message.id}>
              <div className="admin-message-meta">
                <span className="admin-visitor-name">{message.displayName}</span>
                <span className="admin-message-time">{formatAdminTimestamp(message.createdAt)}（北京时间）</span>
                <span className="admin-message-likes"><Heart size={12} fill="currentColor" />{message.likes}</span>
                <b className={deleted ? 'deleted' : message.status}>{deleted ? '已删除' : message.status === 'visible' ? '公开' : '已隐藏'}</b>
              </div>
              <p>{message.body}</p>
              {visitorId && (
                <div className={`admin-mute-panel${visitorMuted ? ' is-muted' : ''}`}>
                  <span>{visitorMuted ? <Ban size={14} /> : <ShieldCheck size={14} />}{visitorMuted ? muteLabel(message.mutedUntil) : '该匿名用户当前可以留言'}</span>
                  {visitorMuted ? (
                    <button disabled={visitorBusy} onClick={() => void changeMute(message, 'unmute')}>解除禁言</button>
                  ) : (
                    <div>
                      <select
                        value={selectedMute}
                        onChange={(event) => setMuteChoices((current) => ({ ...current, [visitorId]: event.target.value as MuteDuration }))}
                      >
                        {MUTE_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                      {selectedMute === 'custom' && (
                        <input
                          type="datetime-local"
                          value={customUntil[visitorId] ?? ''}
                          onChange={(event) => setCustomUntil((current) => ({ ...current, [visitorId]: event.target.value }))}
                        />
                      )}
                      <button disabled={visitorBusy} onClick={() => void changeMute(message)}><Ban size={14} />禁言</button>
                    </div>
                  )}
                </div>
              )}
              <footer>
                <span>{message.source === 'seed' ? '预置留言' : `用户 ID：${message.visitorId ?? '历史数据'}`}{message.deletedAt ? ` · 删除于 ${formatAdminTimestamp(message.deletedAt)}` : ''}</span>
                <div>
                  {deleted ? (
                    <button className="restore" disabled={busyId === message.id} onClick={() => void restore(message)}><RotateCcw size={15} />恢复留言</button>
                  ) : (
                    <>
                      <button disabled={busyId === message.id} onClick={() => void changeStatus(message)}>
                        {message.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}{message.status === 'visible' ? '隐藏' : '恢复'}
                      </button>
                      <button className="danger" disabled={busyId === message.id} onClick={() => void remove(message)}><Trash2 size={15} />移入已删除</button>
                    </>
                  )}
                </div>
              </footer>
            </article>
          )
        })}
        {!messages.length && <div className="admin-empty">没有符合条件的留言</div>}
      </section>

      <nav className="admin-pagination" aria-label="留言分页">
        <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16} />上一页</button>
        <span>{totalPages ? `${page} / ${totalPages}` : '0 / 0'}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>下一页<ChevronRight size={16} /></button>
      </nav>
    </main>
  )
}
