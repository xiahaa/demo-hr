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
interface TableColumn {
  name: string;
  type: string;
}

const tableInfo = db.prepare("PRAGMA table_info(cached_profiles)").all() as TableColumn[];

if (tableInfo.length === 0) {
  // Table doesn't exist, create it with new schema
  db.exec(`
    CREATE TABLE cached_profiles (
      cache_key TEXT PRIMARY KEY,
      username TEXT,
      data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} else {
  // Table exists, check if it has the new schema
  const hasCacheKey = tableInfo.some((col) => col.name === 'cache_key');
  
  if (!hasCacheKey) {
    console.log('Migrating cached_profiles table to new schema...');
    db.exec(`
      DROP TABLE cached_profiles;
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
