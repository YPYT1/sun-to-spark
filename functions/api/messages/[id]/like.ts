import { json, methodNotAllowed } from '../../../_lib/http'
import { hashClientIp } from '../../../_lib/security'
import type { Env } from '../../../_lib/types'

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const ip = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
  const voterHash = await hashClientIp(ip, env.MESSAGE_IP_HASH_SALT)
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO message_likes (message_id, voter_hash)
    SELECT ?, ?
    WHERE EXISTS (SELECT 1 FROM messages WHERE id = ? AND status = 'visible')
  `).bind(params.id, voterHash, params.id).run()

  const message = await env.DB.prepare(`
    SELECT likes_count FROM messages WHERE id = ? AND status = 'visible'
  `).bind(params.id).first<{ likes_count: number }>()
  if (!message) return json({ error: '留言不存在' }, { status: 404 })

  if (result.meta.changes) {
    await env.DB.prepare(`
      UPDATE messages SET likes_count = likes_count + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).bind(params.id).run()
  }
  const current = await env.DB.prepare('SELECT likes_count FROM messages WHERE id = ?').bind(params.id).first<{ likes_count: number }>()
  return json({ liked: Boolean(result.meta.changes), likes: current?.likes_count ?? message.likes_count })
}

export const onRequest: PagesFunction<Env, 'id'> = (context) => (
  context.request.method === 'POST' ? onRequestPost(context) : methodNotAllowed()
)
