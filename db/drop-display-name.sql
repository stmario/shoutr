-- Run after deploying app code that no longer uses `users.display_name`.
-- Safe to re-run.

ALTER TABLE users DROP COLUMN IF EXISTS display_name;
