export const ADMIN_PAGE_SIZE = 15

export function getAdminPagination(value: string | null): { page: number; pageSize: number; offset: number } {
  const requested = Number(value ?? 1)
  const page = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : 1
  return {
    page,
    pageSize: ADMIN_PAGE_SIZE,
    offset: (page - 1) * ADMIN_PAGE_SIZE,
  }
}
