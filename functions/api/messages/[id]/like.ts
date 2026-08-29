import { json, methodNotAllowed, readJson } from '../../../_lib/http'
import { normalizeLikeRequest } from '../../../_lib/like-policy'
import { hashClientIp, hashIdentifier, readCookie, verifyVisitorToken } from '../../../_lib/security'
import type { Env } from '../../../_lib/types'
import { ensureVisitor, VISITOR_COOKIE } from '../../../_lib/visitor-store'

function responseHeaders(setCookie: string | null): HeadersInit {
  return setCookie ? { 'Set-Cookie': setCookie } : {}
}

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const desired = normalizeLikeRequest(await readJson(request))
  if (!desired.ok) return json({ error: desired.error }, { status: 400 })

  const identity = await ensureVisitor(request, env)
  const headers = responseHeaders(identity.setCookie)
  const ip = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
  const previousVisitorId = await verifyVisitorToken(readCookie(request, VISITOR_COOKIE), env.MESSAGE_SESSION_SECRET)
  const [voterHash, legacyIpHash, previousVisitorHash] = await Promise.all([
    hashIdentifier(`visitor:${identity.visitor.id}`, env.MESSAGE_IP_HASH_SALT),
    hashClientIp(ip, env.MESSAGE_IP_HASH_SALT),
    previousVisitorId ? hashIdentifier(`visitor:${previousVisitorId}`, env.MESSAGE_IP_HASH_SALT) : Promise.resolve(null),
  ])

  const mutation = desired.liked
    ? [env.DB.prepare(`
        INSERT OR IGNORE INTO message_likes (message_id, voter_hash)
        SELECT ?, ?
        WHERE EXISTS (
          SELECT 1 FROM messages WHERE id = ? AND status = 'visible' AND deleted_at IS NULL
        )
      `).bind(params.id, voterHash, params.id)]
    : [...new Set([voterHash, legacyIpHash, previousVisitorHash].filter((key): key is string => Boolean(key)))].map((key) => env.DB.prepare(`
        DELETE FROM message_likes
        WHERE message_id = ? AND voter_hash = ?
          AND EXISTS (
            SELECT 1 FROM messages WHERE id = ? AND status = 'visible' AND deleted_at IS NULL
          )
      `).bind(params.id, key, params.id))

  const results = await env.DB.batch([
    ...mutation,
    env.DB.prepare(`
      UPDATE messages
      SET likes_count = (
            SELECT COUNT(*) FROM message_likes WHERE message_id = ?
          ),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND status = 'visible' AND deleted_at IS NULL
    `).bind(params.id, params.id),
    env.DB.prepare(`
      SELECT likes_count
      FROM messages
      WHERE id = ? AND status = 'visible' AND deleted_at IS NULL
    `).bind(params.id),
  ])
  const current = results.at(-1)?.results?.[0] as { likes_count: number } | undefined
  if (!current) return json({ error: '留言不存在' }, { status: 404, headers })
  return json({ liked: desired.liked, likes: current.likes_count }, { headers })
}

export const onRequest: PagesFunction<Env, 'id'> = (context) => (
  context.request.method === 'POST' ? onRequestPost(context) : methodNotAllowed()
)
