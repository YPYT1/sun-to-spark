import { countCharacters, normalizeMessageBody } from '../../src/lib/messages'

export type MessageValidation =
  | { ok: true; body: string }
  | { ok: false; error: string }

export function validateMessageBody(input: unknown): MessageValidation {
  if (typeof input !== 'string') return { ok: false, error: '留言不能为空' }
  const body = normalizeMessageBody(input)
  if (!body) return { ok: false, error: '留言不能为空' }
  if (countCharacters(body) > 200) return { ok: false, error: '留言最多 200 字' }
  return { ok: true, body }
}

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeMessageRequestId(input: unknown): string | null {
  return typeof input === 'string' && REQUEST_ID_PATTERN.test(input) ? input.toLowerCase() : null
}

interface PostingCounters {
  recentCount: number
  dailyCount: number
  duplicate: boolean
}

export type PostingDecision = { ok: true } | { ok: false; error: string }

export function evaluatePostingPolicy(counters: PostingCounters): PostingDecision {
  if (counters.duplicate) return { ok: false, error: '请不要重复提交相同留言' }
  if (counters.recentCount >= 3) return { ok: false, error: '提交太频繁，请稍后再试' }
  if (counters.dailyCount >= 20) return { ok: false, error: '今天留言次数已达上限' }
  return { ok: true }
}
