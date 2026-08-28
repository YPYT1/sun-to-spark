const encoder = new TextEncoder()

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', encoder.encode(value))
}

async function hmac(value: string, secret: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', key, encoder.encode(value))
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length)
  let mismatch = left.length ^ right.length
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return mismatch === 0
}

export async function passwordMatches(input: string, configured: string): Promise<boolean> {
  const [left, right] = await Promise.all([sha256(input), sha256(configured)])
  return constantTimeEqual(toHex(left), toHex(right))
}

export async function hashClientIp(ip: string, salt: string): Promise<string> {
  return hashIdentifier(ip, salt)
}

export async function hashIdentifier(value: string, salt: string): Promise<string> {
  return toHex(await hmac(value, salt))
}

export async function createAdminSession(secret: string, now = Date.now()): Promise<string> {
  const expiresAt = now + 12 * 60 * 60 * 1000
  const payload = String(expiresAt)
  return `${payload}.${toHex(await hmac(payload, secret))}`
}

export async function createVisitorToken(visitorId: string, secret: string): Promise<string> {
  return `${visitorId}.${toHex(await hmac(visitorId, secret))}`
}

export async function verifyVisitorToken(token: string | null, secret: string): Promise<string | null> {
  if (!token) return null
  const separator = token.lastIndexOf('.')
  if (separator < 1) return null
  const visitorId = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = toHex(await hmac(visitorId, secret))
  return constantTimeEqual(signature, expected) ? visitorId : null
}

export async function verifyAdminSession(token: string | null, secret: string, now = Date.now()): Promise<boolean> {
  if (!token) return false
  const separator = token.indexOf('.')
  if (separator < 1) return false
  const payload = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false
  const expected = toHex(await hmac(payload, secret))
  return constantTimeEqual(signature, expected)
}

export function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') ?? ''
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}
