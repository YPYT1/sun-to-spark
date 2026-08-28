import { adminCookie } from '../../_lib/admin'
import { json, methodNotAllowed, readJson } from '../../_lib/http'
import { createAdminSession, passwordMatches } from '../../_lib/security'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = await readJson(request)
  const password = typeof payload?.password === 'string' ? payload.password : ''
  if (!await passwordMatches(password, env.MESSAGE_ADMIN_PASSWORD)) {
    return json({ error: '密码错误' }, { status: 401 })
  }

  const token = await createAdminSession(env.MESSAGE_SESSION_SECRET)
  return json(
    { ok: true },
    { headers: { 'Set-Cookie': adminCookie(token, new URL(request.url).protocol === 'https:') } },
  )
}

export const onRequest: PagesFunction<Env> = (context) => (
  context.request.method === 'POST' ? onRequestPost(context) : methodNotAllowed()
)
