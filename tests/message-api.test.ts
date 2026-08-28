import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAdminMessages, fetchMessages, muteVisitor } from '../src/lib/message-api'

afterEach(() => vi.unstubAllGlobals())

describe('message API client', () => {
  it('rejects an HTML SPA fallback instead of returning undefined messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })))
    await expect(fetchMessages()).rejects.toThrow('留言接口返回了无效数据')
  })

  it('rejects a successful JSON response without a messages array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true })))
    await expect(fetchMessages()).rejects.toThrow('留言接口返回了无效数据')
  })

  it('requests a numbered admin page with status and fuzzy search', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      messages: [],
      page: 3,
      pageSize: 15,
      total: 0,
      totalPages: 0,
    }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchAdminMessages('hidden', 3, '海獭 加班')

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/messages?status=hidden&page=3&q=%E6%B5%B7%E7%8D%AD+%E5%8A%A0%E7%8F%AD', undefined)
  })

  it('sends a server-approved mute duration for one anonymous visitor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, mutedUntil: '2026-08-29T08:00:00.000Z' }))
    vi.stubGlobal('fetch', fetchMock)

    await muteVisitor('visitor-123', { duration: '1d' })

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/visitors/visitor-123/mute', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: '1d' }),
    })
  })
})
