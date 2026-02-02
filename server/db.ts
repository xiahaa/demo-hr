import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use environment variable or default to a predictable location in the server directory
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'gittalent.db');
const db = new Database(dbPath);

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
