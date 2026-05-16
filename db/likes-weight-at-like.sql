-- Stake (wei) locked in when the user liked; subtract this exact amount on unlike.
ALTER TABLE likes
  ADD COLUMN IF NOT EXISTS weight_wei NUMERIC(78, 0) NOT NULL DEFAULT 0;
