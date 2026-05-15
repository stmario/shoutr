-- Staked SHOT (wei) cached on the user; like totals sum likers' current weight.
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight numeric(78, 0) NOT NULL DEFAULT 0;

-- Run this before stake-weighted likes (wei values exceed integer max):
-- See also db/alter-like-count-numeric.sql
ALTER TABLE shouts
  ALTER COLUMN like_count TYPE numeric(78, 0)
  USING COALESCE(like_count, 0)::numeric;
