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
/* TABLES */
/* ========================= */

await db.exec(`
CREATE TABLE IF NOT EXISTS business_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    keyword TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  plan TEXT DEFAULT 'FREE',
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  user_id INTEGER,
  deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

/* 🔥 SEO TABLE */
CREATE TABLE IF NOT EXISTS seo_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT,
  city TEXT,
  slug TEXT UNIQUE,
  content TEXT,
  score INTEGER,
  volume INTEGER,
  difficulty INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

/* ========================= */
/* 🔥 MIGRATIONS SAFE */
/* ========================= */

const migrateUsers = async () => {
  const columns = await db.all(`PRAGMA table_info(users)`);

  if (!columns.some(col => col.name === "stripe_customer_id")) {
    console.log("➕ Ajout stripe_customer_id...");
    await db.run(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`);
  }

  if (!columns.some(col => col.name === "subscription_id")) {
    console.log("➕ Ajout subscription_id...");
    await db.run(`ALTER TABLE users ADD COLUMN subscription_id TEXT`);
  }

  if (!columns.some(col => col.name === "subscription_status")) {
    console.log("➕ Ajout subscription_status...");
    await db.run(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive'`);
  }
};

const migrateKeywords = async () => {
  const columns = await db.all(`PRAGMA table_info(keywords)`);

  if (!columns.some(col => col.name === "deleted")) {
    console.log("➕ Ajout colonne deleted...");
    await db.run(`ALTER TABLE keywords ADD COLUMN deleted INTEGER DEFAULT 0`);
  }
};

const migrateBusinessProfiles = async () => {
  const columns = await db.all(`PRAGMA table_info(business_profiles)`);

  if (!columns.some(col => col.name === "score")) {
    console.log("➕ Ajout colonne score...");
    await db.run(`ALTER TABLE business_profiles ADD COLUMN score INTEGER DEFAULT 80`);
  }

  if (!columns.some(col => col.name === "is_featured")) {
    console.log("➕ Ajout colonne is_featured...");
    await db.run(`ALTER TABLE business_profiles ADD COLUMN is_featured INTEGER DEFAULT 0`);
  }
};

/* 🔥 SEO MIGRATION */
const migrateSeoPages = async () => {
  const columns = await db.all(`PRAGMA table_info(seo_pages)`);

  if (!columns.some(col => col.name === "score")) {
    console.log("➕ Ajout colonne score seo_pages...");
    await db.run(`ALTER TABLE seo_pages ADD COLUMN score INTEGER`);
  }

  if (!columns.some(col => col.name === "volume")) {
    console.log("➕ Ajout colonne volume seo_pages...");
    await db.run(`ALTER TABLE seo_pages ADD COLUMN volume INTEGER`);
  }

  if (!columns.some(col => col.name === "difficulty")) {
    console.log("➕ Ajout colonne difficulty seo_pages...");
    await db.run(`ALTER TABLE seo_pages ADD COLUMN difficulty INTEGER`);
  }
};

/* ========================= */
/* 🔥 EXECUTE MIGRATIONS */
/* ========================= */

await migrateUsers();
await migrateKeywords();
await migrateBusinessProfiles();
await migrateSeoPages();

/* ========================= */
/* 🔥 INDEX (PERF) */
/* ========================= */

await db.exec(`
CREATE INDEX IF NOT EXISTS idx_user_keywords ON keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_business_score ON business_profiles(score);
CREATE INDEX IF NOT EXISTS idx_subscription ON users(subscription_id);

/* 🔥 SEO PERF */
CREATE INDEX IF NOT EXISTS idx_seo_slug ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_city ON seo_pages(keyword, city);
`);
await db.exec(`
CREATE TABLE IF NOT EXISTS seo_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT,
    city TEXT,
    slug TEXT UNIQUE,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
/* ========================= */
/* 🔥 HELPERS */
/* ========================= */

export const countUserKeywords = async (userId) => {
  return db.get(`
    SELECT COUNT(*) as total 
    FROM keywords 
    WHERE user_id = ? AND deleted = 0
  `, [userId]);
};

export const countAIUsage = async (userId) => {
  return db.get(`
    SELECT COUNT(*) as total 
    FROM ai_usage 
    WHERE user_id = ?
    AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `, [userId]);
};

export default db;