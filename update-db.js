import db from "./config/database.js";

await db.exec(`

/* ========================= */
/* 🧹 RESET */
/* ========================= */
DROP TABLE IF EXISTS keywords;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ai_usage;

/* ========================= */
/* 👤 USERS */
/* ========================= */
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  plan TEXT DEFAULT 'FREE',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

/* ========================= */
/* 🔎 KEYWORDS */
/* ========================= */
CREATE TABLE keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT,
  volume INTEGER,
  difficulty INTEGER,
  cpc REAL,
  intent TEXT,
  score INTEGER,
  revenue INTEGER,
  potential TEXT,
  decision TEXT, -- ✅ FIX IMPORTANT
  user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(user_id) REFERENCES users(id)
);

/* ========================= */
/* 🤖 AI USAGE */
/* ========================= */
CREATE TABLE ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(user_id) REFERENCES users(id)
);

/* ========================= */
/* ⚡ INDEX (PERF BONUS) */
/* ========================= */
CREATE INDEX idx_keywords_user ON keywords(user_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);

/* ========================= */
/* 🧪 SEED */
/* ========================= */
INSERT INTO users (id, email, plan)
VALUES (1, 'test@test.com', 'FREE');

`);

console.log("✅ DB RESET + MIGRATION OK");
process.exit();