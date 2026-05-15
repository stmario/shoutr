-- Required for stake-weighted likes (wei sums exceed integer max).
ALTER TABLE shouts
  ALTER COLUMN like_count TYPE numeric(78, 0)
  USING COALESCE(like_count, 0)::numeric;
