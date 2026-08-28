export type LikeRequestResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: string }

export function normalizeLikeRequest(payload: Record<string, unknown> | null): LikeRequestResult {
  return typeof payload?.liked === 'boolean'
    ? { ok: true, liked: payload.liked }
    : { ok: false, error: '无效的点赞状态' }
}
