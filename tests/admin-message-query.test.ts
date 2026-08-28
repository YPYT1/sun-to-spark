import { describe, expect, it } from 'vitest'
import { getAdminMessageQuery } from '../functions/_lib/admin-message-query'

describe('admin message query policy', () => {
  it('keeps deleted messages out of active filters and exposes a deleted scope', () => {
    expect(getAdminMessageQuery('all', 'latest')).toEqual({
      filter: 'all',
      condition: 'm.deleted_at IS NULL',
      sort: 'latest',
      orderBy: 'm.created_at DESC, m.id DESC',
    })
    expect(getAdminMessageQuery('deleted', 'latest').condition).toBe('m.deleted_at IS NOT NULL')
  })

  it('supports descending and ascending like-count ordering', () => {
    expect(getAdminMessageQuery('visible', 'likes_desc').orderBy).toBe('m.likes_count DESC, m.created_at DESC, m.id DESC')
    expect(getAdminMessageQuery('hidden', 'likes_asc').orderBy).toBe('m.likes_count ASC, m.created_at DESC, m.id DESC')
  })
})
