export interface PublicMessage {
  id: string
  body: string
  likes: number
  colorSeed: number
  createdAt: string
}

export interface AdminMessage extends PublicMessage {
  status: 'visible' | 'hidden'
  source: 'seed' | 'public'
  updatedAt: string
  visitorId: string | null
  displayName: string
  mutedUntil: string | null
  deletedAt: string | null
}

export function formatAdminTimestamp(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value)).replaceAll('/', '-')
}

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
  : null

export function splitCharacters(value: string): string[] {
  if (!segmenter) return Array.from(value)
  return Array.from(segmenter.segment(value), (part) => part.segment)
}

export function countCharacters(value: string): number {
  return splitCharacters(value).length
}

export function normalizeMessageBody(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function excerptMessage(body: string, limit = 50): { text: string; expandable: boolean } {
  const characters = splitCharacters(body)
  if (characters.length <= limit) return { text: body, expandable: false }
  return { text: `${characters.slice(0, limit).join('')}…`, expandable: true }
}

export function estimateMessageHeight(body: string): number {
  const length = countCharacters(body)
  const lineBreaks = (body.match(/\n/g) ?? []).length
  return 142 + Math.ceil(Math.min(length, 200) / 18) * 21 + lineBreaks * 14
}

export function distributeMessages(messages: PublicMessage[], columnCount: number): PublicMessage[][] {
  const safeCount = Math.max(1, Math.floor(columnCount))
  const columns = Array.from({ length: safeCount }, () => [] as PublicMessage[])
  const heights = Array.from({ length: safeCount }, () => 0)

  for (const message of messages) {
    let target = 0
    for (let index = 1; index < safeCount; index += 1) {
      if (heights[index]! < heights[target]!) target = index
    }
    columns[target]!.push(message)
    heights[target] += estimateMessageHeight(message.body)
  }

  return columns
}

function hashString(value: string): number {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function assignPaletteIndices(messages: PublicMessage[], paletteCount = 18): Map<string, number> {
  const count = Math.max(1, paletteCount)
  const indices = new Map<string, number>()
  let previous = -1

  for (const message of messages) {
    let index = hashString(`${message.id}:${message.colorSeed}`) % count
    if (count > 1 && index === previous) index = (index + 1) % count
    indices.set(message.id, index)
    previous = index
  }

  return indices
}

export function relativeMessageTime(value: string, now = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  return `${months} 个月前`
}
