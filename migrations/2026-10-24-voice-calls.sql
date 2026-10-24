-- 语音通话持久化表(2026-10-24)
-- 执行方式:
--   npx wrangler d1 execute virtual-girlfriend --remote --file migrations/2026-10-24-voice-calls.sql
-- 仅含 CREATE TABLE/INDEX IF NOT EXISTS,可安全重复执行。

CREATE TABLE IF NOT EXISTS voice_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  call_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS voice_call_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  user_text TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_user ON voice_calls(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_call_messages_user_char ON voice_call_messages(user_id, character_id, id);
