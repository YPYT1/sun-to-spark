CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  muted_until TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

ALTER TABLE messages ADD COLUMN visitor_id TEXT REFERENCES visitors(id);

CREATE INDEX IF NOT EXISTS idx_messages_visitor_timeline
  ON messages(visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visitors_display_name
  ON visitors(display_name);

CREATE INDEX IF NOT EXISTS idx_visitors_muted_until
  ON visitors(muted_until);
