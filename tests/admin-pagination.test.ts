import { describe, expect, it } from 'vitest'
import { getAdminPagination } from '../functions/_lib/admin-pagination'

describe('admin message pagination', () => {
  it('serves 15 messages per page and advances the offset by 15', () => {
    expect(getAdminPagination(null)).toEqual({ page: 1, pageSize: 15, offset: 0 })
    expect(getAdminPagination('2')).toEqual({ page: 2, pageSize: 15, offset: 15 })
  })

  it('normalizes invalid page values to the first page', () => {
    expect(getAdminPagination('0')).toEqual({ page: 1, pageSize: 15, offset: 0 })
    expect(getAdminPagination('not-a-number')).toEqual({ page: 1, pageSize: 15, offset: 0 })
  })
})
