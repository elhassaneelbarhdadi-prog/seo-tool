import sqlite3 from "sqlite3";
import { open } from "sqlite";

/* ========================= */
/* INIT DB */
/* ========================= */

const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database
});

/* ========================= */
/* SQLITE CONFIG */
/* ========================= */

await db.exec(`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
`);

if (process.env.NODE_ENV === "development") {
  console.log("📦 DB CONNECTED");
}

/* ========================= */
/* TABLES */
/* ========================= */

await db.exec(`

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    email TEXT UNIQUE,

    password TEXT,

    plan TEXT DEFAULT 'FREE',

    plan_expiration DATETIME,

    credits INTEGER DEFAULT 0,

    stripe_customer_id TEXT,

    subscription_id TEXT,

    subscription_status TEXT DEFAULT 'inactive',

    role TEXT DEFAULT 'user',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

`);

/* ========================= */
/* KEYWORDS */
/* ========================= */

await db.exec(`

CREATE TABLE IF NOT EXISTS keywords (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    keyword TEXT,

    volume INTEGER,

    difficulty INTEGER,

    cpc REAL,

    intent TEXT,

    score INTEGER,

    revenue INTEGER,

    potential TEXT,

    decision TEXT,

    trend TEXT,

    user_id INTEGER,

    deleted INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

`);

/* ========================= */
/* AI USAGE */
/* ========================= */

await db.exec(`

CREATE TABLE IF NOT EXISTS ai_usage (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    message TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

`);

/* ========================= */
/* BUSINESS */
/* ========================= */

await db.exec(`

CREATE TABLE IF NOT EXISTS business_profiles (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    name TEXT,

    description TEXT,

    keyword TEXT,

    city TEXT,

    score INTEGER DEFAULT 80,

    is_featured INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

`);

/* ========================= */
/* SEO PAGES */
/* ========================= */

await db.exec(`

CREATE TABLE IF NOT EXISTS seo_pages (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    keyword TEXT,

    city TEXT,

    slug TEXT UNIQUE,

    title TEXT,

    content TEXT,

    score INTEGER,

    volume INTEGER,

    difficulty INTEGER,

    cpc REAL,

    revenue INTEGER,

    trend TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

`);

/* ========================= */
/* SAFE MIGRATIONS */
/* ========================= */

const ALLOWED_TABLES = [

  "users",
  "keywords",
  "business_profiles",
  "seo_pages"

];

const safeAddColumn = async (
  table,
  column,
  definition
) => {

  if (!ALLOWED_TABLES.includes(table)) {

    throw new Error(
      `Unauthorized migration on ${table}`
    );
  }

  const columns =
    await db.all(
      `PRAGMA table_info("${table}")`
    );

  if (!columns.some(
    c => c.name === column
  )) {

    try {

      await db.run(
        `ALTER TABLE ${table}
                 ADD COLUMN ${column}
                 ${definition}`
      );

      if (
        process.env.NODE_ENV ===
        "development"
      ) {

        console.log(
          `➕ ${table}.${column} ajouté`
        );
      }

    } catch (e) {

      if (
        process.env.NODE_ENV ===
        "development"
      ) {

        console.log(
          `⚠️ ${table}.${column} déjà existant`
        );
      }
    }
  }
};

/* ========================= */
/* MIGRATION */
/* ========================= */

const migrate = async () => {

  /* USERS */

  await safeAddColumn(
    "users",
    "role",
    "TEXT DEFAULT 'user'"
  );

  await safeAddColumn(
    "users",
    "plan_expiration",
    "DATETIME"
  );

  await safeAddColumn(
    "users",
    "credits",
    "INTEGER DEFAULT 0"
  );

  /* KEYWORDS */

  await safeAddColumn(
    "keywords",
    "deleted",
    "INTEGER DEFAULT 0"
  );

  await safeAddColumn(
    "keywords",
    "decision",
    "TEXT"
  );

  await safeAddColumn(
    "keywords",
    "trend",
    "TEXT"
  );

  /* BUSINESS */

  await safeAddColumn(
    "business_profiles",
    "score",
    "INTEGER DEFAULT 80"
  );

  await safeAddColumn(
    "business_profiles",
    "is_featured",
    "INTEGER DEFAULT 0"
  );

  /* SEO */

  await safeAddColumn(
    "seo_pages",
    "keyword",
    "TEXT"
  );

  await safeAddColumn(
    "seo_pages",
    "city",
    "TEXT"
  );

  await safeAddColumn(
    "seo_pages",
    "title",
    "TEXT"
  );

  await safeAddColumn(
    "seo_pages",
    "score",
    "INTEGER"
  );

  await safeAddColumn(
    "seo_pages",
    "volume",
    "INTEGER"
  );

  await safeAddColumn(
    "seo_pages",
    "difficulty",
    "INTEGER"
  );

  await safeAddColumn(
    "seo_pages",
    "cpc",
    "REAL"
  );

  await safeAddColumn(
    "seo_pages",
    "revenue",
    "INTEGER"
  );

  await safeAddColumn(
    "seo_pages",
    "trend",
    "TEXT"
  );
};

await migrate();

/* ========================= */
/* INDEX */
/* ========================= */

await db.exec(`

CREATE INDEX IF NOT EXISTS idx_user_keywords
ON keywords(user_id);

CREATE INDEX IF NOT EXISTS idx_keywords_user_created
ON keywords(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_score
ON business_profiles(score);

CREATE INDEX IF NOT EXISTS idx_subscription
ON users(subscription_id);

CREATE INDEX IF NOT EXISTS idx_seo_slug
ON seo_pages(slug);

CREATE INDEX IF NOT EXISTS idx_seo_keyword_city
ON seo_pages(keyword, city);

CREATE INDEX IF NOT EXISTS idx_ai_user
ON ai_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_user_date
ON ai_usage(user_id, created_at);

`);

/* ========================= */
/* HELPERS */
/* ========================= */

export const countUserKeywords =
  async (userId) => {

    return db.get(`

    SELECT COUNT(*) as total
    FROM keywords
    WHERE user_id=?
    AND deleted=0

    `, [userId]);

  };

export const countAIUsage =
  async (userId) => {

    return db.get(`

    SELECT COUNT(*) as total

    FROM ai_usage

    WHERE user_id=?

    AND strftime(
      '%Y-%m',
      created_at
    ) = strftime(
      '%Y-%m',
      'now'
    )

    `, [userId]);

  };

/* ========================= */
/* EXPORT */
/* ========================= */

export default db;