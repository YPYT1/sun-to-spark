import { json } from './http'
import { readCookie, verifyAdminSession } from './security'
import type { Env } from './types'

export const ADMIN_COOKIE = 'message_admin_session'

export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  const valid = await verifyAdminSession(readCookie(request, ADMIN_COOKIE), env.MESSAGE_SESSION_SECRET)
  return valid ? null : json({ error: '请先登录管理后台' }, { status: 401 })
}

export function adminCookie(token: string, secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Strict',
    'Max-Age=43200',
  ].filter(Boolean).join('; ')
}

export function clearAdminCookie(secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Strict',
    'Max-Age=0',
  ].filter(Boolean).join('; ')
}
