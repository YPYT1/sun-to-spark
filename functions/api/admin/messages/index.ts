import { requireAdmin } from '../../../_lib/admin'
import { json, methodNotAllowed } from '../../../_lib/http'
import { toAdminMessage } from '../../../_lib/message-store'
import type { AdminMessageRow, Env } from '../../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const normalizedStatus = status === 'visible' || status === 'hidden' ? status : null
  const requestedPage = Number(url.searchParams.get('page') ?? 1)
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1
  const pageSize = 50
  const search = (url.searchParams.get('q') ?? '').trim().slice(0, 100)
  const conditions: string[] = []
  const bindings: unknown[] = []

  if (normalizedStatus) {
    conditions.push('m.status = ?')
    bindings.push(normalizedStatus)
  }
  if (search) {
    conditions.push(`(m.body LIKE ? ESCAPE '\\' OR COALESCE(v.display_name, '') LIKE ? ESCAPE '\\')`)
    const escaped = search.replace(/[\\%_]/g, '\\$&')
    bindings.push(`%${escaped}%`, `%${escaped}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  const [countRow, listResult] = await Promise.all([
    env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM messages m
      LEFT JOIN visitors v ON v.id = m.visitor_id
      ${where}
    `).bind(...bindings).first<{ total: number }>(),
    env.DB.prepare(`
    SELECT m.id, m.body, m.likes_count, m.status, m.source, m.color_seed,
           m.created_at, m.updated_at, m.ip_hash, m.visitor_id,
           v.display_name, v.muted_until
    FROM messages m
    LEFT JOIN visitors v ON v.id = m.visitor_id
    ${where}
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, pageSize, offset).all<AdminMessageRow>(),
  ])

  const total = Number(countRow?.total ?? 0)
  const rows = listResult.results ?? []
  return json({
    messages: rows.map(toAdminMessage),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  })
}

export const onRequest: PagesFunction<Env> = (context) => (
  context.request.method === 'GET' ? onRequestGet(context) : methodNotAllowed()
)
