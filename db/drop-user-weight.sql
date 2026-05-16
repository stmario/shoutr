-- Staked SHOT is read from the staking contract; do not cache on users.
ALTER TABLE users DROP COLUMN IF EXISTS weight;
