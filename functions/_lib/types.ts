export interface Env {
  DB: D1Database
  MESSAGE_ADMIN_PASSWORD: string
  MESSAGE_SESSION_SECRET: string
  MESSAGE_IP_HASH_SALT: string
}

export interface MessageRow {
  id: string
  body: string
  likes_count: number
  status: 'visible' | 'hidden'
  source: 'seed' | 'public'
  color_seed: number
  created_at: string
  updated_at: string
  ip_hash: string | null
  visitor_id: string | null
}

export interface AdminMessageRow extends MessageRow {
  display_name: string | null
  muted_until: string | null
}

export interface VisitorRow {
  id: string
  display_name: string
  muted_until: string | null
  created_at: string
}

export interface PublicMessageDto {
  id: string
  body: string
  likes: number
  colorSeed: number
  createdAt: string
}

export interface AdminMessageDto extends PublicMessageDto {
  status: 'visible' | 'hidden'
  source: 'seed' | 'public'
  updatedAt: string
  visitorId: string | null
  displayName: string
  mutedUntil: string | null
}
