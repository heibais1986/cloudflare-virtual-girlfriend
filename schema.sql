-- D1 Database Schema for Virtual Girlfriend

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_vip INTEGER DEFAULT 0,
  vip_expires_at DATETIME
);

-- Default user
INSERT OR IGNORE INTO users (username, email, password_hash, is_vip) VALUES ('admin', 'admin@example.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1) 

-- User sessions table (for token-based auth)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chat sessions table (one session per user per character)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  last_message TEXT,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, character_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Character media library
CREATE TABLE IF NOT EXISTS character_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',
  blur_url TEXT NOT NULL,
  hd_url TEXT,
  is_vip_only INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User unlocks (media that user has unlocked)
CREATE TABLE IF NOT EXISTS user_unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (media_id) REFERENCES character_media(id),
  UNIQUE(user_id, media_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_char ON chat_sessions(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_character_media_char ON character_media(character_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_unlocks_user ON user_unlocks(user_id);

-- ============================================
-- Photo Request Feature Tables
-- ============================================

-- Wardrobe items (clothing and accessories)
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('clothing', 'accessory')),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  icon TEXT,
  prompt_fragment TEXT,
  is_vip_only INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Character preset photos (pre-generated for each outfit)
CREATE TABLE IF NOT EXISTS character_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT NOT NULL,
  outfit_code TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  blur_r2_key TEXT,
  width INTEGER DEFAULT 512,
  height INTEGER DEFAULT 768,
  is_vip_only INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photo generation requests log
CREATE TABLE IF NOT EXISTS photo_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  outfit_selection TEXT,
  result_url TEXT,
  result_r2_key TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for photo request tables
CREATE INDEX IF NOT EXISTS idx_wardrobe_type ON wardrobe_items(type, category);
CREATE INDEX IF NOT EXISTS idx_photos_character ON character_photos(character_id, outfit_code);
CREATE INDEX IF NOT EXISTS idx_photo_requests_user ON photo_requests(user_id, created_at);

-- Default wardrobe items data
INSERT OR IGNORE INTO wardrobe_items (type, category, name, name_zh, icon, sort_order) VALUES
('clothing', 'casual', 'Dress', '连衣裙', '👗', 1),
('clothing', 'casual', 'T-Shirt', 'T恤', '👚', 2),
('clothing', 'casual', 'Jacket', '外套', '🧥', 3),
('clothing', 'formal', 'Suit', '正装', '👔', 4),
('clothing', 'formal', 'Evening', '晚礼服', '👗', 5),
('clothing', 'sport', 'Sportswear', '运动装', '🎽', 6),
('clothing', 'sleep', 'Sleepwear', '睡衣', '🛌', 7),
('clothing', 'swim', 'Swimwear', '泳装', '👙', 8),
('accessory', 'jewelry', 'Necklace', '项链', '📿', 1),
('accessory', 'jewelry', 'Earrings', '耳环', '💎', 2),
('accessory', 'eyewear', 'Glasses', '眼镜', '👓', 3),
('accessory', 'headwear', 'Hat', '帽子', '🎩', 4),
('accessory', 'hair', 'Hairpin', '发夹', '🎀', 5),
('accessory', 'watch', 'Watch', '手表', '⌚', 6),
('accessory', 'bag', 'Handbag', '手提包', '👜', 7),
('accessory', 'scarf', 'Scarf', '围巾', '🧣', 8);

-- Preset character photos (clothing items 1-8 for each character)
INSERT OR IGNORE INTO character_photos (character_id, outfit_code, r2_key, is_vip_only, sort_order) VALUES
-- Yuki photos
('yuki', 'outfit_1', 'photos/yuki/dress.jpg', 1, 1),
('yuki', 'outfit_2', 'photos/yuki/tshirt.jpg', 1, 2),
('yuki', 'outfit_3', 'photos/yuki/jacket.jpg', 1, 3),
('yuki', 'outfit_4', 'photos/yuki/suit.jpg', 1, 4),
('yuki', 'outfit_5', 'photos/yuki/evening.jpg', 1, 5),
('yuki', 'outfit_6', 'photos/yuki/sportswear.jpg', 1, 6),
('yuki', 'outfit_7', 'photos/yuki/sleepwear.jpg', 1, 7),
('yuki', 'outfit_8', 'photos/yuki/swimwear.jpg', 1, 8),
-- Aria photos
('aria', 'outfit_1', 'photos/aria/dress.jpg', 1, 1),
('aria', 'outfit_2', 'photos/aria/tshirt.jpg', 1, 2),
('aria', 'outfit_3', 'photos/aria/jacket.jpg', 1, 3),
('aria', 'outfit_4', 'photos/aria/suit.jpg', 1, 4),
('aria', 'outfit_5', 'photos/aria/evening.jpg', 1, 5),
('aria', 'outfit_6', 'photos/aria/sportswear.jpg', 1, 6),
('aria', 'outfit_7', 'photos/aria/sleepwear.jpg', 1, 7),
('aria', 'outfit_8', 'photos/aria/swimwear.jpg', 1, 8),
-- Luna photos
('luna', 'outfit_1', 'photos/luna/dress.jpg', 1, 1),
('luna', 'outfit_2', 'photos/luna/tshirt.jpg', 1, 2),
('luna', 'outfit_3', 'photos/luna/jacket.jpg', 1, 3),
('luna', 'outfit_4', 'photos/luna/suit.jpg', 1, 4),
('luna', 'outfit_5', 'photos/luna/evening.jpg', 1, 5),
('luna', 'outfit_6', 'photos/luna/sportswear.jpg', 1, 6),
('luna', 'outfit_7', 'photos/luna/sleepwear.jpg', 1, 7),
('luna', 'outfit_8', 'photos/luna/swimwear.jpg', 1, 8);

-- ============================================
-- Chat Image Generation Feature Tables
-- ============================================

-- AI Image generation records
CREATE TABLE IF NOT EXISTS image_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  session_id TEXT,
  prompt TEXT NOT NULL,
  scene_context TEXT,
  r2_key TEXT,
  blur_r2_key TEXT,
  width INTEGER DEFAULT 512,
  height INTEGER DEFAULT 768,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User viewed images record (for VIP analytics)
CREATE TABLE IF NOT EXISTS user_viewed_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  generation_id INTEGER NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (generation_id) REFERENCES image_generations(id),
  UNIQUE(user_id, generation_id)
);

-- Indexes for image generation tables
CREATE INDEX IF NOT EXISTS idx_image_gen_user ON image_generations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_image_gen_status ON image_generations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_viewed ON user_viewed_images(user_id, generation_id);

