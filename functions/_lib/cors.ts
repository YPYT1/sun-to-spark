const PUBLIC_ORIGIN = 'https://sun-to-spark.pages.dev'

function isPublicMessageApi(request: Request): boolean {
  return new URL(request.url).pathname.startsWith('/api/messages')
}

export function applyPublicCors(request: Request, response: Response): Response {
  if (!isPublicMessageApi(request) || request.headers.get('Origin') !== PUBLIC_ORIGIN) return response
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', PUBLIC_ORIGIN)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Message-Visitor-Key')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  headers.append('Vary', 'Origin')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export function publicCorsPreflight(request: Request): Response | null {
  if (request.method !== 'OPTIONS' || !isPublicMessageApi(request) || request.headers.get('Origin') !== PUBLIC_ORIGIN) return null
  return applyPublicCors(request, new Response(null, { status: 204 }))
}
