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

  CREATE INDEX IF NOT EXISTS idx_analysis_logs_github_username
    ON analysis_logs (github_username);
  CREATE TABLE IF NOT EXISTS cached_profiles (
    username TEXT PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
