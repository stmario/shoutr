-- Optional: add vote direction on notifications (not used by current app/schema).
-- The Drizzle schema no longer includes notifications.vote_type; vote rows use only `type` = 'vote'.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS vote_type integer;
