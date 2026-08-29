import { json, methodNotAllowed, readJson } from '../_lib/http'
import { evaluatePostingPolicy, normalizeMessageRequestId, validateMessageBody } from '../_lib/message-policy'
import { toPublicMessage } from '../_lib/message-store'
import { hashClientIp } from '../_lib/security'
import { ensureVisitor } from '../_lib/visitor-store'
import { evaluateMute } from '../_lib/visitor'
import type { Env, MessageRow } from '../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const identity = await ensureVisitor(request, env)
  const requested = Number(new URL(request.url).searchParams.get('limit') ?? 60)
  const limit = Number.isFinite(requested) ? Math.min(60, Math.max(1, Math.floor(requested))) : 60
  const result = await env.DB.prepare(`
    SELECT id, body, likes_count, status, source, color_seed, created_at, updated_at, ip_hash, visitor_id, deleted_at
    FROM messages
    WHERE status = 'visible' AND deleted_at IS NULL
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).bind(limit).all<MessageRow>()
  return json(
    { messages: (result.results ?? []).map(toPublicMessage) },
    identity.setCookie ? { headers: { 'Set-Cookie': identity.setCookie } } : {},
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = await readJson(request)
  const validation = validateMessageBody(payload?.body)
  if (!validation.ok) return json({ error: validation.error }, { status: 400 })

  const identity = await ensureVisitor(request, env)
  const requestedId = normalizeMessageRequestId(payload?.requestId)
  if (requestedId) {
    const existing = await env.DB.prepare(`
      SELECT id, body, likes_count, status, source, color_seed, created_at, updated_at, ip_hash, visitor_id, deleted_at
      FROM messages WHERE id = ?
    `).bind(requestedId).first<MessageRow>()
    if (existing) {
      if (existing.body !== validation.body) {
        return json({ error: '留言请求标识冲突' }, { status: 409 })
      }
      return json(
        { message: toPublicMessage(existing) },
        { headers: identity.setCookie ? { 'Set-Cookie': identity.setCookie } : {} },
      )
    }
  }
  const mute = evaluateMute(identity.visitor.muted_until)
  if (mute.muted) {
    return json(
      { error: mute.error },
      { status: 403, headers: identity.setCookie ? { 'Set-Cookie': identity.setCookie } : {} },
    )
  }

  const ip = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
  const id = requestedId ?? crypto.randomUUID()
  const ipHash = await hashClientIp(ip, env.MESSAGE_IP_HASH_SALT)
  const [counts, duplicate] = await Promise.all([
    env.DB.prepare(`
      SELECT
        COUNT(*) AS daily_count,
        COALESCE(SUM(CASE WHEN datetime(created_at) >= datetime('now', '-10 minutes') THEN 1 ELSE 0 END), 0) AS recent_count
      FROM messages
      WHERE ip_hash = ? AND datetime(created_at) >= datetime('now', '-1 day')
    `).bind(ipHash).first<{ daily_count: number; recent_count: number }>(),
    env.DB.prepare(`
      SELECT 1 AS found
      FROM messages
      WHERE ip_hash = ? AND body = ? AND datetime(created_at) >= datetime('now', '-1 day')
      LIMIT 1
    `).bind(ipHash, validation.body).first<{ found: number }>(),
  ])

  const decision = evaluatePostingPolicy({
    recentCount: Number(counts?.recent_count ?? 0),
    dailyCount: Number(counts?.daily_count ?? 0),
    duplicate: Boolean(duplicate),
  })
  if (!decision.ok) {
    return json(
      { error: decision.error },
      { status: 429, headers: identity.setCookie ? { 'Set-Cookie': identity.setCookie } : {} },
    )
  }

  const colorSeed = crypto.getRandomValues(new Uint32Array(1))[0]! % 18
  await env.DB.prepare(`
    INSERT INTO messages (id, body, status, source, color_seed, ip_hash, visitor_id)
    VALUES (?, ?, 'visible', 'public', ?, ?, ?)
  `).bind(id, validation.body, colorSeed, ipHash, identity.visitor.id).run()

  const row = await env.DB.prepare(`
    SELECT id, body, likes_count, status, source, color_seed, created_at, updated_at, ip_hash, visitor_id, deleted_at
    FROM messages WHERE id = ?
  `).bind(id).first<MessageRow>()
  if (!row) return json({ error: '留言保存失败' }, { status: 500 })

  return json(
    { message: toPublicMessage(row) },
    { status: 201, headers: identity.setCookie ? { 'Set-Cookie': identity.setCookie } : {} },
  )
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'GET') return onRequestGet(context)
  if (context.request.method === 'POST') return onRequestPost(context)
  return methodNotAllowed()
}
