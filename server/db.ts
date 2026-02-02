import Database from 'better-sqlite3';

const db = new Database('gittalent.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    github_username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Handle cached_profiles table with schema migration
try {
  // Try to create new schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS cached_profiles (
      cache_key TEXT PRIMARY KEY,
      username TEXT,
      data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {
  // Table might exist with old schema, migrate it
  const tableInfo = db.prepare("PRAGMA table_info(cached_profiles)").all() as any[];
  const hasCacheKey = tableInfo.some((col: any) => col.name === 'cache_key');
  
  if (!hasCacheKey) {
    console.log('Migrating cached_profiles table to new schema...');
    db.exec(`
      DROP TABLE IF EXISTS cached_profiles;
      CREATE TABLE cached_profiles (
        cache_key TEXT PRIMARY KEY,
        username TEXT,
        data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

export default db;
