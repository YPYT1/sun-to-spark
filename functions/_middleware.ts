import { applyPublicCors, publicCorsPreflight } from './_lib/cors'
import type { Env } from './_lib/types'

export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  const preflight = publicCorsPreflight(request)
  if (preflight) return preflight
  return applyPublicCors(request, await next())
}
