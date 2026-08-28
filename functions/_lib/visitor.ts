export const PERMANENT_MUTE = '9999-12-31T23:59:59.999Z'

const ADJECTIVES = [
  '沉着的', '清醒的', '松弛的', '认真的', '慢热的', '勇敢的', '安静的', '通透的',
  '倔强的', '温柔的', '清醒的', '自在的', '可靠的', '敏锐的', '坦荡的', '踏实的',
]

const ANIMALS = [
  '企鹅', '鲸鱼', '海獭', '夜猫', '海豚', '河狸', '松鼠', '灰狼',
  '雨燕', '橘猫', '树懒', '浣熊', '白鹭', '斑马', '狐狸', '刺猬',
]

type MuteDuration = '1h' | '1d' | '7d' | '30d' | 'permanent' | 'custom' | 'unmute'

export type MuteRequestResult =
  | { ok: true; mutedUntil: string | null }
  | { ok: false; error: string }

export function buildVisitorDisplayName(adjectiveSeed: number, animalSeed: number, suffixSeed: number): string {
  const adjective = ADJECTIVES[Math.abs(adjectiveSeed) % ADJECTIVES.length]!
  const animal = ANIMALS[Math.abs(animalSeed) % ANIMALS.length]!
  const suffix = String(Math.abs(suffixSeed) % 10_000).padStart(4, '0')
  return `${adjective}${animal}·${suffix}`
}

export function generateVisitorDisplayName(): string {
  const values = crypto.getRandomValues(new Uint32Array(3))
  return buildVisitorDisplayName(values[0]!, values[1]!, values[2]!)
}

export function normalizeMuteRequest(payload: Record<string, unknown> | null, now = Date.now()): MuteRequestResult {
  const duration = payload?.duration as MuteDuration | undefined
  if (duration === 'unmute') return { ok: true, mutedUntil: null }
  if (duration === 'permanent') return { ok: true, mutedUntil: PERMANENT_MUTE }

  if (duration === 'custom') {
    const until = typeof payload?.until === 'string' ? new Date(payload.until) : null
    if (!until || !Number.isFinite(until.getTime())) return { ok: false, error: '请输入有效的禁言截止时间' }
    if (until.getTime() <= now) return { ok: false, error: '禁言截止时间必须晚于现在' }
    return { ok: true, mutedUntil: until.toISOString() }
  }

  const durationMs: Partial<Record<MuteDuration, number>> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  const milliseconds = duration ? durationMs[duration] : undefined
  return milliseconds
    ? { ok: true, mutedUntil: new Date(now + milliseconds).toISOString() }
    : { ok: false, error: '不支持的禁言时长' }
}

export function evaluateMute(mutedUntil: string | null, now = Date.now()): { muted: false } | { muted: true; error: string } {
  if (!mutedUntil) return { muted: false }
  if (mutedUntil === PERMANENT_MUTE) return { muted: true, error: '该浏览器已被永久禁言' }
  const remaining = new Date(mutedUntil).getTime() - now
  if (!Number.isFinite(remaining) || remaining <= 0) return { muted: false }
  const minutes = Math.ceil(remaining / 60_000)
  if (minutes < 60) return { muted: true, error: `该浏览器已被禁言，剩余约 ${minutes} 分钟` }
  const hours = Math.ceil(remaining / 3_600_000)
  if (hours < 24) return { muted: true, error: `该浏览器已被禁言，剩余约 ${hours} 小时` }
  const days = Math.ceil(remaining / 86_400_000)
  return { muted: true, error: `该浏览器已被禁言，剩余约 ${days} 天` }
}
