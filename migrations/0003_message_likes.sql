ALTER TABLE messages ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS message_likes (
  message_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (message_id, voter_hash),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_likes_voter
  ON message_likes(voter_hash, created_at DESC);
