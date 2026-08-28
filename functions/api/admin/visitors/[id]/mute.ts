import { requireAdmin } from '../../../../_lib/admin'
import { json, methodNotAllowed, readJson } from '../../../../_lib/http'
import type { Env } from '../../../../_lib/types'
import { normalizeMuteRequest } from '../../../../_lib/visitor'

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const unauthorized = await requireAdmin(request, env)
  if (unauthorized) return unauthorized

  const id = String(params.id ?? '')
  const normalized = normalizeMuteRequest(await readJson(request))
  if (!normalized.ok) return json({ error: normalized.error }, { status: 400 })

  const result = await env.DB.prepare(`
    UPDATE visitors
    SET muted_until = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).bind(normalized.mutedUntil, id).run()
  if (Number(result.meta.changes ?? 0) === 0) return json({ error: '匿名用户不存在' }, { status: 404 })

  return json({ ok: true, mutedUntil: normalized.mutedUntil })
}

export const onRequest: PagesFunction<Env> = (context) => (
  context.request.method === 'PATCH' ? onRequestPatch(context) : methodNotAllowed()
)
