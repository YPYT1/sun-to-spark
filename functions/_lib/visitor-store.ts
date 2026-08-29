import { createVisitorToken, hashIdentifier, readCookie, verifyVisitorToken } from './security'
import type { Env, VisitorRow } from './types'
import { generateVisitorDisplayName } from './visitor'

export const VISITOR_COOKIE = 'message_visitor'
export const VISITOR_KEY_HEADER = 'X-Message-Visitor-Key'

const VISITOR_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

async function createOrFindVisitor(env: Env, id: string): Promise<VisitorRow | null> {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO visitors (id, display_name) VALUES (?, ?)
  `).bind(id, generateVisitorDisplayName()).run()
  return findVisitor(env, id)
}

export async function ensureVisitor(request: Request, env: Env): Promise<{ visitor: VisitorRow; setCookie: string | null }> {
  const existingId = await verifyVisitorToken(readCookie(request, VISITOR_COOKIE), env.MESSAGE_SESSION_SECRET)
  if (existingId) {
    const existing = await findVisitor(env, existingId)
    if (existing) return { visitor: existing, setCookie: null }
  }

  const browserKey = request.headers.get(VISITOR_KEY_HEADER)
  if (browserKey && VISITOR_KEY_PATTERN.test(browserKey)) {
    const hash = await hashIdentifier(`browser:${browserKey.toLowerCase()}`, env.MESSAGE_SESSION_SECRET)
    const id = `browser-${hash.slice(0, 32)}`
    const visitor = await createOrFindVisitor(env, id)
    if (visitor) {
      const token = await createVisitorToken(id, env.MESSAGE_SESSION_SECRET)
      return {
        visitor,
        setCookie: visitorCookie(token, new URL(request.url).protocol === 'https:'),
      }
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID()
    const visitor = await createOrFindVisitor(env, id)
    if (visitor) {
      const token = await createVisitorToken(id, env.MESSAGE_SESSION_SECRET)
      return {
        visitor,
        setCookie: visitorCookie(token, new URL(request.url).protocol === 'https:'),
      }
    }
  }
  throw new Error('匿名身份创建失败')
}
