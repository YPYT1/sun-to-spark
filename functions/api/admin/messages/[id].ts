import { requireAdmin } from '../../../_lib/admin'
import { json, methodNotAllowed, readJson } from '../../../_lib/http'
import type { Env } from '../../../_lib/types'

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env)
  if (unauthorized) return unauthorized

  const payload = await readJson(request)
  const status = payload?.status
  if (status !== 'visible' && status !== 'hidden') {
    return json({ error: '无效的留言状态' }, { status: 400 })
  }

  const result = await env.DB.prepare(`
    UPDATE messages
    SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).bind(status, params.id).run()
  if (!result.meta.changes) return json({ error: '留言不存在' }, { status: 404 })
  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env)
  if (unauthorized) return unauthorized

  const result = await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(params.id).run()
  if (!result.meta.changes) return json({ error: '留言不存在' }, { status: 404 })
  return json({ ok: true })
}

export const onRequest: PagesFunction<Env, 'id'> = (context) => {
  if (context.request.method === 'PATCH') return onRequestPatch(context)
  if (context.request.method === 'DELETE') return onRequestDelete(context)
  return methodNotAllowed()
}
