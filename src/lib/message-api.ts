import type { AdminMessage, PublicMessage } from './messages'

interface ApiError {
  error?: string
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  let payload: T & ApiError
  try {
    payload = await response.json() as T & ApiError
  } catch {
    throw new Error('留言接口返回了无效数据')
  }
  if (!response.ok) throw new Error(payload.error || '请求失败，请稍后再试')
  return payload
}

export async function fetchMessages(limit = 60): Promise<PublicMessage[]> {
  const payload = await requestJson<{ messages: PublicMessage[] }>(`/api/messages?limit=${limit}`)
  if (!Array.isArray(payload.messages)) throw new Error('留言接口返回了无效数据')
  return payload.messages
}

export async function postMessage(body: string): Promise<PublicMessage> {
  const payload = await requestJson<{ message: PublicMessage }>('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  return payload.message
}

export async function likeMessage(id: string, liked: boolean): Promise<{ liked: boolean; likes: number }> {
  return requestJson<{ liked: boolean; likes: number }>(`/api/messages/${encodeURIComponent(id)}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
  })
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
