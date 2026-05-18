-- Audit log for stake-weighted comment moderation deletions
CREATE TABLE IF NOT EXISTS comment_deletions (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL,
  shout_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  author_weight_at_deletion NUMERIC(78, 0) NOT NULL DEFAULT 0,
  deleter_weight_at_deletion NUMERIC(78, 0) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_deletions_comment_id ON comment_deletions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_deletions_deleted_by ON comment_deletions(deleted_by_id);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS comment_deletion_id INTEGER REFERENCES comment_deletions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_comment_deletion_id ON notifications(comment_deletion_id);
