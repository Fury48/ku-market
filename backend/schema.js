const schemaVersion = 1;

const tableSchemas = {
  users: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false, unique: true },
      { name: 'username', type: 'TEXT', nullable: false, unique: true },
      { name: 'nickname', type: 'TEXT', nullable: false, unique: true },
      { name: 'password', type: 'TEXT', nullable: false },
      { name: 'department', type: 'TEXT', nullable: false },
      { name: 'student_year', type: 'INTEGER', nullable: false },
      { name: 'bio', type: 'TEXT', nullable: false },
      { name: 'manner_score', type: 'REAL', nullable: false },
      { name: 'profile_image_url', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  posts: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'post_name', type: 'TEXT', nullable: false, unique: true },
      { name: 'author_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'title', type: 'TEXT', nullable: false },
      { name: 'content', type: 'TEXT', nullable: false },
      { name: 'category', type: 'TEXT', nullable: false },
      { name: 'subcategory', type: 'TEXT', nullable: false },
      { name: 'price', type: 'INTEGER', nullable: true },
      { name: 'status', type: 'TEXT', nullable: false },
      { name: 'trade_type', type: 'TEXT', nullable: true },
      { name: 'location', type: 'TEXT', nullable: true },
      { name: 'is_price_offer_allowed', type: 'INTEGER', nullable: false },
      { name: 'recruitment_target', type: 'INTEGER', nullable: true },
      { name: 'recruitment_current', type: 'INTEGER', nullable: true },
      { name: 'tags', type: 'JSON', nullable: false },
      { name: 'created_at', type: 'TEXT', nullable: false },
      { name: 'updated_at', type: 'TEXT', nullable: false },
    ],
  },
  post_images: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'post_id', type: 'INTEGER', nullable: false, references: 'posts.id' },
      { name: 'image_url', type: 'TEXT', nullable: false },
      { name: 'sort_order', type: 'INTEGER', nullable: false },
    ],
  },
  post_likes: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'post_id', type: 'INTEGER', nullable: false, references: 'posts.id' },
      { name: 'user_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  comments: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'post_id', type: 'INTEGER', nullable: false, references: 'posts.id' },
      { name: 'user_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'content', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  notifications: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'recipient_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'actor_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'post_id', type: 'INTEGER', nullable: false, references: 'posts.id' },
      { name: 'type', type: 'TEXT', nullable: false },
      { name: 'message', type: 'TEXT', nullable: false },
      { name: 'read_at', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  chat_rooms: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'post_id', type: 'INTEGER', nullable: false, references: 'posts.id' },
      { name: 'seller_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'buyer_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  messages: {
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'room_id', type: 'INTEGER', nullable: false, references: 'chat_rooms.id' },
      { name: 'sender_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'content', type: 'TEXT', nullable: false },
      { name: 'image_url', type: 'TEXT', nullable: true },
      { name: 'read_by', type: 'JSON', nullable: false },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
  sessions: {
    primaryKey: 'token',
    columns: [
      { name: 'token', type: 'TEXT', nullable: false },
      { name: 'user_id', type: 'INTEGER', nullable: false, references: 'users.id' },
      { name: 'persisted', type: 'INTEGER', nullable: false },
      { name: 'expires_at', type: 'TEXT', nullable: false },
    ],
  },
  verification_codes: {
    primaryKey: 'email',
    columns: [
      { name: 'email', type: 'TEXT', nullable: false },
      { name: 'code', type: 'TEXT', nullable: false },
      { name: 'verified', type: 'INTEGER', nullable: false },
      { name: 'created_at', type: 'TEXT', nullable: false },
    ],
  },
};

function createEmptyState() {
  return {
    schemaVersion,
    nextIds: {
      users: 1,
      posts: 1,
      postImages: 1,
      postLikes: 1,
      comments: 1,
      notifications: 1,
      chatRooms: 1,
      messages: 1,
    },
    users: [],
    posts: [],
    post_images: [],
    post_likes: [],
    comments: [],
    notifications: [],
    chat_rooms: [],
    messages: [],
    sessions: [],
    verification_codes: [],
  };
}

const schemaSql = `CREATE TABLE users (
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

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
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
);`;

module.exports = {
  schemaVersion,
  tableSchemas,
  createEmptyState,
  schemaSql,
};
