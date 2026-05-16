-- Notify authors when a moderator deletes their shout (survives shout row cascade).
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS shout_deletion_id INTEGER REFERENCES shout_deletions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_shout_deletion_id ON notifications(shout_deletion_id);
