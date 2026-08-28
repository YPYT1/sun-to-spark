import { requireAdmin } from '../../../_lib/admin'
import { getAdminMessageQuery } from '../../../_lib/admin-message-query'
import { getAdminPagination } from '../../../_lib/admin-pagination'
import { json, methodNotAllowed } from '../../../_lib/http'
import { toAdminMessage } from '../../../_lib/message-store'
import type { AdminMessageRow, Env } from '../../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = await requireAdmin(request, env)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const queryPolicy = getAdminMessageQuery(url.searchParams.get('status'), url.searchParams.get('sort'))
  const { page, pageSize, offset } = getAdminPagination(url.searchParams.get('page'))
  const search = (url.searchParams.get('q') ?? '').trim().slice(0, 100)
  const conditions: string[] = [queryPolicy.condition]
  const bindings: unknown[] = []

  if (queryPolicy.filter === 'visible' || queryPolicy.filter === 'hidden') bindings.push(queryPolicy.filter)
  if (search) {
    conditions.push(`(m.body LIKE ? ESCAPE '\\' OR COALESCE(v.display_name, '') LIKE ? ESCAPE '\\')`)
    const escaped = search.replace(/[\\%_]/g, '\\$&')
    bindings.push(`%${escaped}%`, `%${escaped}%`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const [countRow, listResult] = await Promise.all([
    env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM messages m
      LEFT JOIN visitors v ON v.id = m.visitor_id
      ${where}
    `).bind(...bindings).first<{ total: number }>(),
    env.DB.prepare(`
    SELECT m.id, m.body, m.likes_count, m.status, m.source, m.color_seed,
           m.created_at, m.updated_at, m.ip_hash, m.visitor_id, m.deleted_at,
           v.display_name, v.muted_until
    FROM messages m
    LEFT JOIN visitors v ON v.id = m.visitor_id
    ${where}
    ORDER BY ${queryPolicy.orderBy}
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
    sort: queryPolicy.sort,
  })
}

export const onRequest: PagesFunction<Env> = (context) => (
  context.request.method === 'GET' ? onRequestGet(context) : methodNotAllowed()
)
