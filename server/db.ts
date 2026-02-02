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

  CREATE TABLE IF NOT EXISTS cached_profiles (
    username TEXT PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Graceful shutdown handler
let isDatabaseClosed = false;
export function closeDatabase() {
  if (isDatabaseClosed) {
    console.log('Database already closed');
    return;
  }
  try {
    db.close();
    isDatabaseClosed = true;
    console.log('Database closed successfully');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

export default db;
