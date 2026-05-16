-- Audit log for stake-weighted moderation deletions
CREATE TABLE IF NOT EXISTS shout_deletions (
  id SERIAL PRIMARY KEY,
  shout_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  deleted_by_id INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  author_weight_at_deletion NUMERIC(78, 0) NOT NULL DEFAULT 0,
  deleter_weight_at_deletion NUMERIC(78, 0) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shout_deletions_shout_id ON shout_deletions(shout_id);
CREATE INDEX IF NOT EXISTS idx_shout_deletions_deleted_by ON shout_deletions(deleted_by_id);
