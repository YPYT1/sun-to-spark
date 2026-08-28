ALTER TABLE messages ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_admin_deleted
  ON messages(deleted_at, status, likes_count, created_at DESC, id DESC);
