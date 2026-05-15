-- Enforce wallet_address on users (SIWE-only app).
-- Run in Neon SQL Editor after reviewing rows with NULL wallet_address.

-- 1) Inspect orphans
-- SELECT id, username, created_at FROM users WHERE wallet_address IS NULL;

-- 2) Remove wallet-less users with no posts (safe cleanup)
DELETE FROM users u
WHERE u.wallet_address IS NULL
  AND NOT EXISTS (SELECT 1 FROM shouts s WHERE s.user_id = u.id);

-- 3) If any NULL rows remain, delete manually or sign in with SIWE to link holder_* accounts first.

-- 4) Require wallet on every user (fails until no NULLs remain)
ALTER TABLE users ALTER COLUMN wallet_address SET NOT NULL;

DROP INDEX IF EXISTS users_wallet_address_unique;
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_unique ON users (wallet_address);
