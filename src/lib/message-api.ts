import type { AdminMessage, PublicMessage } from './messages'

interface ApiError {
  error?: string
}

const VISITOR_KEY_STORAGE = 'life-time-bill-message-visitor-key'
const VISITOR_KEY_HEADER = 'X-Message-Visitor-Key'
const PUBLIC_API_FALLBACK_ORIGIN = 'https://484b0cc2.sun-to-spark.pages.dev'

export class MessageNetworkError extends Error {
  readonly retryable = true
}

export function isMessageNetworkError(error: unknown): error is MessageNetworkError {
  return error instanceof MessageNetworkError
}

function getVisitorKey(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY_STORAGE)
    if (existing) return existing
    const created = crypto.randomUUID()
    window.localStorage.setItem(VISITOR_KEY_STORAGE, created)
    return created
  } catch {
    return null
  }
}

function publicRequest(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  const visitorKey = getVisitorKey()
  if (visitorKey) headers.set(VISITOR_KEY_HEADER, visitorKey)
  return { ...init, headers }
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: T & ApiError
  try {
    payload = await response.json() as T & ApiError
  } catch {
    throw new Error('留言接口返回了无效数据')
  }
  if (!response.ok) throw new Error(payload.error || '请求失败，请稍后再试')
  return payload
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  return readResponse<T>(await fetch(input, init))
}

async function requestPublicJson<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: unknown
  for (const input of [path, new URL(path, PUBLIC_API_FALLBACK_ORIGIN)]) {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 5_000)
    let response: Response
    try {
      response = await fetch(input, { ...init, signal: controller.signal, credentials: 'include' })
    } catch (error) {
      lastError = error
      continue
    } finally {
      globalThis.clearTimeout(timeout)
    }
    if ([502, 503, 504].includes(response.status)) {
      lastError = new Error(`HTTP ${response.status}`)
      continue
    }
    return readResponse<T>(response)
  }
  throw new MessageNetworkError('网络连接不稳定，请检查网络后重试', { cause: lastError })
}

export async function fetchMessages(limit = 60): Promise<PublicMessage[]> {
  const payload = await requestPublicJson<{ messages: PublicMessage[] }>(`/api/messages?limit=${limit}`, publicRequest())
  if (!Array.isArray(payload.messages)) throw new Error('留言接口返回了无效数据')
  return payload.messages
}

export async function postMessage(body: string, requestId: string = crypto.randomUUID()): Promise<PublicMessage> {
  const payload = await requestPublicJson<{ message: PublicMessage }>('/api/messages', publicRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, requestId }),
  }))
  return payload.message
}

export async function likeMessage(id: string, liked: boolean): Promise<{ liked: boolean; likes: number }> {
  return requestPublicJson<{ liked: boolean; likes: number }>(`/api/messages/${encodeURIComponent(id)}/like`, publicRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
  }))
}

export interface AdminMessagePage {
  messages: AdminMessage[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  sort: AdminMessageSort
}

export type AdminMessageFilter = 'all' | 'visible' | 'hidden' | 'deleted'
export type AdminMessageSort = 'latest' | 'likes_desc' | 'likes_asc'

export async function fetchAdminMessages(status: AdminMessageFilter, page = 1, query = '', sort: AdminMessageSort = 'latest'): Promise<AdminMessagePage> {
  const search = new URLSearchParams()
  if (status !== 'all') search.set('status', status)
  search.set('page', String(page))
  if (query) search.set('q', query)
  search.set('sort', sort)
  return requestJson<AdminMessagePage>(`/api/admin/messages?${search}`, undefined)
}

export type MuteDuration = '1h' | '1d' | '7d' | '30d' | 'permanent' | 'custom' | 'unmute'

export async function muteVisitor(id: string, input: { duration: MuteDuration; until?: string }): Promise<{ ok: true; mutedUntil: string | null }> {
  return requestJson(`/api/admin/visitors/${encodeURIComponent(id)}/mute`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function loginAdmin(password: string): Promise<void> {
  await requestJson('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export async function logoutAdmin(): Promise<void> {
  await requestJson('/api/admin/logout', { method: 'POST' })
}

export async function setMessageStatus(id: string, status: 'visible' | 'hidden'): Promise<void> {
  await requestJson(`/api/admin/messages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export async function softDeleteMessage(id: string): Promise<void> {
  await requestJson(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function restoreMessage(id: string): Promise<void> {
  await requestJson(`/api/admin/messages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted: false }),
  })
}
