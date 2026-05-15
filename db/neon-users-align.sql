-- Align `public.users` with `lib/schema.ts` (Neon / PostgreSQL).
-- Run in Neon SQL Editor when columns are missing (e.g. "email does not exist").
-- Safe to re-run: only `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;

-- Partial unique: many NULL wallet_address rows allowed, non-null must be unique
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_unique
  ON users (wallet_address)
  WHERE wallet_address IS NOT NULL;
