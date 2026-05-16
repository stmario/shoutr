-- Reshouts (reposts) — one per user per shout
CREATE TABLE IF NOT EXISTS reshouts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shout_id INTEGER NOT NULL REFERENCES shouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, shout_id)
);

CREATE INDEX IF NOT EXISTS idx_reshouts_shout_id ON reshouts(shout_id);
CREATE INDEX IF NOT EXISTS idx_reshouts_user_created ON reshouts(user_id, created_at DESC);
