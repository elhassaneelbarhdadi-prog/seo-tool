import db from "./config/database.js";

await db.exec(`
DROP TABLE IF EXISTS keywords;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  password TEXT,
  plan TEXT DEFAULT 'FREE',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT
);

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
  user_id INTEGER,
  created_at TEXT
);

INSERT INTO users (id, email, plan)
VALUES (1, 'test@test.com', 'FREE');
`);

console.log("✅ DB RESET OK");
process.exit();