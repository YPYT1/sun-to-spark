import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAdminMessages, fetchMessages, likeMessage, muteVisitor, postMessage, restoreMessage } from '../src/lib/message-api'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

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

    await fetchAdminMessages('hidden', 3, '海獭 加班', 'likes_desc')

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/messages?status=hidden&page=3&q=%E6%B5%B7%E7%8D%AD+%E5%8A%A0%E7%8F%AD&sort=likes_desc', undefined)
  })

  it('requests the desired unlike state instead of a one-way like', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ liked: false, likes: 7 }))
    vi.stubGlobal('fetch', fetchMock)

    await likeMessage('message-1', false)

    expect(fetchMock).toHaveBeenCalledWith('/api/messages/message-1/like', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ liked: false }),
    }))
    expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get('Content-Type')).toBe('application/json')
  })

  it('retries a public request after a connection-level failure', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(Response.json({ messages: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const resultPromise = fetchMessages()
    await vi.runAllTimersAsync()

    await expect(resultPromise).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1]![0])).toBe('https://484b0cc2.sun-to-spark.pages.dev/api/messages?limit=60')
  })

  it('sends a stable request id so a retried comment cannot be inserted twice', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ message: { id: 'request-1' } }))
    vi.stubGlobal('fetch', fetchMock)

    await postMessage('留言', 'd6d37b1b-043e-4b3c-9cb4-45e981a82782')

    expect(fetchMock).toHaveBeenCalledWith('/api/messages', expect.objectContaining({
      body: JSON.stringify({ body: '留言', requestId: 'd6d37b1b-043e-4b3c-9cb4-45e981a82782' }),
    }))
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

  it('restores a logically deleted message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await restoreMessage('message-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/messages/message-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted: false }),
    })
  })
})
