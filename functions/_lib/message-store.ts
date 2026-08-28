import type { AdminMessageDto, AdminMessageRow, MessageRow, PublicMessageDto } from './types'

export function toPublicMessage(row: MessageRow): PublicMessageDto {
  return {
    id: row.id,
    body: row.body,
    likes: row.likes_count,
    colorSeed: row.color_seed,
    createdAt: row.created_at,
  }
}

export function toAdminMessage(row: AdminMessageRow): AdminMessageDto {
  return {
    ...toPublicMessage(row),
    status: row.status,
    source: row.source,
    updatedAt: row.updated_at,
    visitorId: row.visitor_id,
    displayName: row.display_name ?? (row.source === 'seed' ? '往期匿名留言' : '历史匿名用户'),
    mutedUntil: row.muted_until ?? null,
  }
}
