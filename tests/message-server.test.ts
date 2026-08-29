import { describe, expect, it } from 'vitest'
import {
  createAdminSession,
  createVisitorToken,
  hashClientIp,
  passwordMatches,
  verifyAdminSession,
  verifyVisitorToken,
} from '../functions/_lib/security'
import {
  evaluatePostingPolicy,
  normalizeMessageRequestId,
  validateMessageBody,
} from '../functions/_lib/message-policy'
import { normalizeLikeRequest } from '../functions/_lib/like-policy'
import {
  buildVisitorDisplayName,
  evaluateMute,
  normalizeMuteRequest,
} from '../functions/_lib/visitor'
import { applyPublicCors, publicCorsPreflight } from '../functions/_lib/cors'

describe('message server policy', () => {
  it('accepts 1–200 Unicode characters and rejects larger input', () => {
    expect(validateMessageBody('  今天准时下班。  ')).toEqual({ ok: true, body: '今天准时下班。' })
    expect(validateMessageBody('')).toEqual({ ok: false, error: '留言不能为空' })
    expect(validateMessageBody('界'.repeat(201))).toEqual({ ok: false, error: '留言最多 200 字' })
  })

  it('accepts only UUID comment request ids for idempotent retries', () => {
    expect(normalizeMessageRequestId('d6d37b1b-043e-4b3c-9cb4-45e981a82782')).toBe('d6d37b1b-043e-4b3c-9cb4-45e981a82782')
    expect(normalizeMessageRequestId('seed-01')).toBeNull()
    expect(normalizeMessageRequestId(null)).toBeNull()
  })

  it('enforces recent, daily, and duplicate limits', () => {
    expect(evaluatePostingPolicy({ recentCount: 2, dailyCount: 19, duplicate: false })).toEqual({ ok: true })
    expect(evaluatePostingPolicy({ recentCount: 3, dailyCount: 3, duplicate: false })).toEqual({ ok: false, error: '提交太频繁，请稍后再试' })
    expect(evaluatePostingPolicy({ recentCount: 0, dailyCount: 20, duplicate: false })).toEqual({ ok: false, error: '今天留言次数已达上限' })
    expect(evaluatePostingPolicy({ recentCount: 0, dailyCount: 0, duplicate: true })).toEqual({ ok: false, error: '请不要重复提交相同留言' })
  })

  it('signs a 12-hour admin session and rejects expiry or tampering', async () => {
    const now = Date.UTC(2026, 7, 28, 8, 0, 0)
    const token = await createAdminSession('session-secret', now)
    expect(await verifyAdminSession(token, 'session-secret', now + 11 * 60 * 60 * 1000)).toBe(true)
    expect(await verifyAdminSession(`${token}x`, 'session-secret', now)).toBe(false)
    expect(await verifyAdminSession(token, 'session-secret', now + 13 * 60 * 60 * 1000)).toBe(false)
  })

  it('compares the configured password and hashes IPs without storing the original', async () => {
    expect(await passwordMatches('WLT0827.+', 'WLT0827.+')).toBe(true)
    expect(await passwordMatches('wrong', 'WLT0827.+')).toBe(false)
    const hash = await hashClientIp('203.0.113.7', 'ip-salt')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toContain('203.0.113.7')
  })

  it('issues a signed browser identity that cannot be altered', async () => {
    const token = await createVisitorToken('visitor-123', 'session-secret')
    expect(await verifyVisitorToken(token, 'session-secret')).toBe('visitor-123')
    expect(await verifyVisitorToken(token.replace('visitor-123', 'visitor-456'), 'session-secret')).toBeNull()
    expect(await verifyVisitorToken(null, 'session-secret')).toBeNull()
  })

  it('creates a random-looking server-owned display name', () => {
    expect(buildVisitorDisplayName(1, 2, 4821)).toBe('清醒的海獭·4821')
    expect(buildVisitorDisplayName(25, 26, 7)).toMatch(/^.+·0007$/)
  })

  it('normalizes preset, custom, permanent, and unmute requests', () => {
    const now = Date.UTC(2026, 7, 28, 8, 0, 0)
    expect(normalizeMuteRequest({ duration: '1h' }, now)).toEqual({ ok: true, mutedUntil: '2026-08-28T09:00:00.000Z' })
    expect(normalizeMuteRequest({ duration: 'permanent' }, now)).toEqual({ ok: true, mutedUntil: '9999-12-31T23:59:59.999Z' })
    expect(normalizeMuteRequest({ duration: 'custom', until: '2026-08-30T12:30:00.000Z' }, now)).toEqual({ ok: true, mutedUntil: '2026-08-30T12:30:00.000Z' })
    expect(normalizeMuteRequest({ duration: 'custom', until: '2026-08-27T12:30:00.000Z' }, now)).toEqual({ ok: false, error: '禁言截止时间必须晚于现在' })
    expect(normalizeMuteRequest({ duration: 'unmute' }, now)).toEqual({ ok: true, mutedUntil: null })
  })

  it('reports whether a visitor is currently muted', () => {
    const now = Date.UTC(2026, 7, 28, 8, 0, 0)
    expect(evaluateMute(null, now)).toEqual({ muted: false })
    expect(evaluateMute('2026-08-28T07:59:59.000Z', now)).toEqual({ muted: false })
    expect(evaluateMute('2026-08-28T10:00:00.000Z', now)).toEqual({ muted: true, error: '该浏览器已被禁言，剩余约 2 小时' })
    expect(evaluateMute('9999-12-31T23:59:59.999Z', now)).toEqual({ muted: true, error: '该浏览器已被永久禁言' })
  })

  it('accepts an explicit like or unlike target state', () => {
    expect(normalizeLikeRequest({ liked: true })).toEqual({ ok: true, liked: true })
    expect(normalizeLikeRequest({ liked: false })).toEqual({ ok: true, liked: false })
    expect(normalizeLikeRequest({})).toEqual({ ok: false, error: '无效的点赞状态' })
  })

  it('allows the production page to use a deployment URL as an API fallback', () => {
    const request = new Request('https://deployment.pages.dev/api/messages', {
      headers: { Origin: 'https://sun-to-spark.pages.dev' },
    })
    const response = applyPublicCors(request, Response.json({ ok: true }))
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://sun-to-spark.pages.dev')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Message-Visitor-Key')

    const preflight = publicCorsPreflight(new Request(request.url, {
      method: 'OPTIONS',
      headers: { Origin: 'https://sun-to-spark.pages.dev' },
    }))
    expect(preflight?.status).toBe(204)

    const adminResponse = applyPublicCors(new Request('https://deployment.pages.dev/api/admin/messages', {
      headers: { Origin: 'https://sun-to-spark.pages.dev' },
    }), Response.json({ ok: true }))
    expect(adminResponse.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
