CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  department TEXT NOT NULL,
  student_year INTEGER NOT NULL,
  bio TEXT NOT NULL,
  manner_score REAL NOT NULL,
  profile_image_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_name TEXT NOT NULL UNIQUE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  price INTEGER,
  status TEXT NOT NULL,
  trade_type TEXT,
  location TEXT,
  is_price_offer_allowed INTEGER NOT NULL DEFAULT 0,
  recruitment_target INTEGER,
  recruitment_current INTEGER,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE post_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT,
  read_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  persisted INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  verified INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
