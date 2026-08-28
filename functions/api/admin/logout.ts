import { clearAdminCookie } from '../../_lib/admin'
import { json, methodNotAllowed } from '../../_lib/http'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request }) => json(
  { ok: true },
  { headers: { 'Set-Cookie': clearAdminCookie(new URL(request.url).protocol === 'https:') } },
)

export const onRequest: PagesFunction<Env> = (context) => (
  context.request.method === 'POST' ? onRequestPost(context) : methodNotAllowed()
)
