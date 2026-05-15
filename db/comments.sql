-- Comments on shouts
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shout_id INTEGER NOT NULL REFERENCES shouts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_shout_id ON comments (shout_id);
CREATE INDEX IF NOT EXISTS idx_comments_shout_created ON comments (shout_id, created_at ASC);
