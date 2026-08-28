export type AdminMessageFilter = 'all' | 'visible' | 'hidden' | 'deleted'
export type AdminMessageSort = 'latest' | 'likes_desc' | 'likes_asc'

export interface AdminMessageQuery {
  filter: AdminMessageFilter
  condition: string
  sort: AdminMessageSort
  orderBy: string
}

export function getAdminMessageQuery(filterValue: string | null, sortValue: string | null): AdminMessageQuery {
  const filter: AdminMessageFilter = filterValue === 'visible' || filterValue === 'hidden' || filterValue === 'deleted'
    ? filterValue
    : 'all'
  const sort: AdminMessageSort = sortValue === 'likes_desc' || sortValue === 'likes_asc' ? sortValue : 'latest'
  const condition = filter === 'deleted'
    ? 'm.deleted_at IS NOT NULL'
    : filter === 'visible' || filter === 'hidden'
      ? 'm.deleted_at IS NULL AND m.status = ?'
      : 'm.deleted_at IS NULL'
  const orderBy = sort === 'likes_desc'
    ? 'm.likes_count DESC, m.created_at DESC, m.id DESC'
    : sort === 'likes_asc'
      ? 'm.likes_count ASC, m.created_at DESC, m.id DESC'
      : 'm.created_at DESC, m.id DESC'
  return { filter, condition, sort, orderBy }
}
