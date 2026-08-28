import { createVisitorToken, readCookie, verifyVisitorToken } from './security'
import type { Env, VisitorRow } from './types'
import { generateVisitorDisplayName } from './visitor'

export const VISITOR_COOKIE = 'message_visitor'

function visitorCookie(token: string, secure: boolean): string {
  return [
    `${VISITOR_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Lax',
    'Max-Age=31536000',
  ].filter(Boolean).join('; ')
}

async function findVisitor(env: Env, id: string): Promise<VisitorRow | null> {
  return env.DB.prepare(`
    SELECT id, display_name, muted_until, created_at
    FROM visitors WHERE id = ?
  `).bind(id).first<VisitorRow>()
}

export async function ensureVisitor(request: Request, env: Env): Promise<{ visitor: VisitorRow; setCookie: string | null }> {
  const existingId = await verifyVisitorToken(readCookie(request, VISITOR_COOKIE), env.MESSAGE_SESSION_SECRET)
  if (existingId) {
    const existing = await findVisitor(env, existingId)
    if (existing) return { visitor: existing, setCookie: null }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID()
    const displayName = generateVisitorDisplayName()
    const result = await env.DB.prepare(`
      INSERT OR IGNORE INTO visitors (id, display_name) VALUES (?, ?)
    `).bind(id, displayName).run()
    if (Number(result.meta.changes ?? 0) > 0) {
      const visitor = await findVisitor(env, id)
      if (!visitor) continue
      const token = await createVisitorToken(id, env.MESSAGE_SESSION_SECRET)
      return {
        visitor,
        setCookie: visitorCookie(token, new URL(request.url).protocol === 'https:'),
      }
    }
  }
  throw new Error('匿名身份创建失败')
}
